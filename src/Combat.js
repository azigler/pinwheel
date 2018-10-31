'use strict';

// TODO: fix deathblow emit when skill/effect kills on behalf of killer

const Damage = require('./Damage');
const Logger = require('./Logger');
const RandomUtil = require('./Util/RandomUtil');
const CombatErrors = require('./Error/CombatErrors');
const Parser = require('./CommandParser');
const Broadcast = require('./Broadcast');

/**
 * Turn-based combat system. Combatants attack and then have some amount of lag applied to them
 * based on their weapon speed. Character attribute and skills determine the outcome of each round.
 */
class Combat {
  /**
   * Handle a single combat round for any given attacker. Every updateTick, this function is
   * called on every player and combat-enabled NPC.
   * @param {GameState} state
   * @param {Character} attacker
   * @return {boolean}  true if combat actions were performed this round
   */
  static updateRound(state, attacker) {
    // if dead, skip combat
    if (attacker.getAttribute('health') <= 0) {
      return false;
    }

    // if not in combat, skip combat
    if (!attacker.isInCombat()) {
      if (!attacker.isNpc) {
        attacker.removePrompt('combat');
      }
      return false;
    }

    // determine combat lag
    let lastRoundStarted = attacker.combatData.roundStarted;
    attacker.combatData.roundStarted = Date.now();

    // if the attacker's combat lag hasn't expired yet, skip combat
    if (attacker.combatData.lag > 0) {
      const elapsed = Date.now() - lastRoundStarted;
      attacker.combatData.lag -= elapsed;
      return false;
    }

    // selects first valid target from attacker's combatant list
    let target = null;
    try {
      target = Combat.chooseCombatant(attacker);
    } catch (e) {
      attacker.removeFromCombat();
      attacker.combatData = {};
      throw e;
    }

    // if no targets left, remove attacker from and skip combat
    if (!target) {
      attacker.removeFromCombat();
      // reset combat data at the end of combat
      attacker.combatData = {};
      return false;
    }
    
    // enable combat debugging in the debug dojo
    if (attacker.room.area.name === "dojo") {
      attacker.combatData.meta = 'debug';
    } else {
      attacker.combatData.meta = '';
    }
    
    attacker.combatData.buffer = '';

    // if target succeeds in dodging
    if (Combat.checkDodge(attacker, target)) {
      // announce debugging for the combat round
      if (attacker.combatData.meta === 'debug') {
        Broadcast.sayAt(attacker.room, attacker.combatData.buffer);
      }

      // announce dodge
      target.emit('dodge', attacker);
      attacker.emit('dodged', target);

      // apply combat lag like any attack
      attacker.combatData.lag = this.getWeaponSpeed(attacker) * 1000;

      // calculate chances for skill gains upon dodging
      RandomUtil.calculateSkillGain(target, 'dodge');
      RandomUtil.calculateSkillGain(attacker, 'offense');
      return false;
    }

    // if target succeeds in blocking
    if (Combat.checkBlock(attacker, target)) {
      // announce debugging for the combat round
      if (attacker.combatData.meta === 'debug') {
        Broadcast.sayAt(attacker.room, attacker.combatData.buffer);
      }

      // announce block
      target.emit('block', attacker);
      attacker.emit('blocked', target);

      // apply combat lag like any attack
      attacker.combatData.lag = this.getWeaponSpeed(attacker) * 1000;

      // calculate chances for skill gains upon blocking
      RandomUtil.calculateSkillGain(target, 'block');
      RandomUtil.calculateSkillGain(attacker, 'offense');
      return false;
    }

    // apply attack
    Combat.makeAttack(state, attacker, target);
    return true;
  }

  /**
   * Find a target for a given attacker
   * @param {Character} attacker
   * @return {Character|null}
   */
  static chooseCombatant(attacker) {
    // if no eligible combatants, return null
    if (!attacker.combatants.size) {
      return null;
    }

    for (const target of attacker.combatants) {
      // if the target doesn't have a health attribute, throw an error
      if (!target.hasAttribute('health')) {
        throw new CombatErrors.CombatInvalidTargetError();
      }
      // get the first target in the combatant list with a positive health attribute
      // TODO: allow player to designate their target
      if (target.getAttribute('health') > 0) {
        return target;
      }
    }

    return null;
  }

  /**
   * Check if a target succeeds in dodging an attack
   * @param {Character} attacker
   * @param {Character} target
   * @returns {boolean} if the strike was dodged
   */
  static checkDodge(attacker, target) {
    const attackerReflexes = attacker.getAttribute('reflexes') || 0;
    const targetReflexes = target.getAttribute('reflexes') || 0;
    const dodge = target.getAttribute('dodge') || 0;
    const fail = '<b><red>FAIL</red></b>';
    const pass = '<b><green>PASS</green></b>';

    const chance = 20 + (targetReflexes - attackerReflexes) + (dodge / 5);

    const result = RandomUtil.probability(chance);

    // pass status into debug
    let status;
    if (result === true) {
      status = pass;
    } else {
      status = fail;
    }
    attacker.combatData.buffer += `<b><cyan>${target.name} attempts dodge</cyan></b> -> <b><white>${chance}</b>%</white> chance...${status}`;

    return result;
  }

  /**
   * Check if a target succeeds in blocking an attack
   * @param {Character} attacker
   * @param {Character} target
   * @returns {boolean} if the strike was blocked
   */
  static checkBlock(attacker, target) {
    const attackerBrawn = attacker.getAttribute('brawn') || 0;
    const targetEndurance = target.getAttribute('endurance') || 0;
    const attackerHasWeapon = attacker.equipment.get('wield') || false;
    const targetHasWeapon = target.equipment.get('wield') || false;
    const block = target.getAttribute('block') || 0;
    const shield = target.equipment.get('held') || false;
    const fail = '<b><red>FAIL</red></b>';
    const pass = '<b><green>PASS</green></b>';
    let chance = 0;

    // if target is holding a shield
    if (shield) {
      chance = 20 + (targetEndurance - attackerBrawn) + (block / 5);
      chance = chance > 0 ? chance : 0;
    }

    // if target has a weapon and atacker is unarmed
    else if (!attackerHasWeapon && targetHasWeapon) {
      chance = 15 + (targetEndurance - attackerBrawn) + (block / 5);
      chance = chance > 0 ? chance : 0;
    }

    // if both unarmed
    else if (!attackerHasWeapon && !targetHasWeapon) {
      chance = 10 + (targetEndurance - attackerBrawn) + (block / 5);
      chance = chance > 0 ? chance : 0;
    }

    // if target is unarmed and attacker has a weapon
    else if (attackerHasWeapon && !targetHasWeapon) {
      chance = 0;
    }

    const result = RandomUtil.probability(chance);
    
    // pass status into debug
    let status;
    if (result === true) {
      status = pass;
    } else {
      status = fail;
    }
    attacker.combatData.buffer += `\n<b><cyan>${target.name} attempts block</cyan></b> -> <b><white>${chance}</b>%</white> chance...${status}`;

    return result;
  }

  /**
   * Actually apply some damage from an attacker to a target
   * @param {state}     state
   * @param {Character} attacker
   * @param {Character} target
   */
  static makeAttack(state, attacker, target) {
    const amount = this.calculateWeaponDamage(attacker);
    const damage = new Damage({ attribute: 'health', amount, attacker });

    // announce debugging for the combat round
    if (attacker.combatData.meta === 'debug') {
      Broadcast.sayAt(attacker.room, attacker.combatData.buffer);
    }

    damage.commit(target);

    // if the target is killed, record the killer
    if (target.getAttribute('health') <= 0) {
      target.combatData.killedBy = attacker;
    }

    // combat lag = the character's weapon speed in seconds
    attacker.combatData.lag = this.getWeaponSpeed(attacker) * 1000;

    // calculate chances for gaining any masteries
    RandomUtil.calculateSkillGain(attacker, 'offense');
    const weapon = attacker.equipment.get('wield');
    if (!weapon) {
      RandomUtil.calculateSkillGain(attacker, 'unarmed');
    } else {
      switch (weapon.metadata.type) {
        case 'blade': {
          RandomUtil.calculateSkillGain(attacker, 'blades');
          break;
        }
        case 'club': {
          RandomUtil.calculateSkillGain(attacker, 'clubs');
          break;
        }
        case 'polearm': {
          RandomUtil.calculateSkillGain(attacker, 'polearms');
          break;
        }
      }
    }
  }

  /**
   * Get the damage the baseline damage of the character's equipped weapons.
   * @param {Character} attacker
   * @return {{max: number, min: number}}
   */
  static getWeaponDamage(attacker) {
    const weapon = attacker.equipment.get('wield');
    const brawn = attacker.getAttribute('brawn') || 0;
    let min = 0,
    max = 0,
    discName,
    weaponMastery,
    formula;
    
    // if attacker is unarmed
    if (!weapon) {
      discName = 'Unarmed';
      weaponMastery = attacker.getAttribute('unarmed') || 0;
      formula = '(unarmed + (brawn / 7))/10 to (unarmed + (brawn / 4))/5';
      min = (weaponMastery + (brawn / 7)) / 10;
      max = (weaponMastery + (brawn / 4)) / 5;
    } else {
      switch (weapon.metadata.type) {
        // if attacker is using a blade weapon
        case 'blade': {
          discName = 'Blades';
          weaponMastery = attacker.getAttribute('blades') || 0;
          formula = '(blades + (brawn / 5))/7 to (blades + (brawn / 3))/4';
          min = weapon.metadata.minDamage + ((weaponMastery + (brawn / 5)) / 7);
          max = weapon.metadata.maxDamage + ((weaponMastery + (brawn / 3)) / 4);
          break;
        }
        // if attacker is using a club weapon
        case 'club': {
          discName = 'Clubs';
          weaponMastery = attacker.getAttribute('clubs') || 0;
          formula = '(clubs + (brawn / 5))/6 to (clubs + (brawn / 3))/4';
          min = weapon.metadata.minDamage + ((weaponMastery + (brawn / 5)) / 6);
          max = weapon.metadata.maxDamage + ((weaponMastery + (brawn / 3)) / 4);
          break;
        }
        // if attacker is using a polearm weapon
        case 'polearm': {
          discName = 'Polearms';
          weaponMastery = attacker.getAttribute('polearms') || 0;
          formula = '(polearms + (brawn / 5))/5 to (polearms + (brawn / 3))/3';
          min = weapon.metadata.minDamage + ((weaponMastery + (brawn / 5)) / 5);
          max = weapon.metadata.maxDamage + ((weaponMastery + (brawn / 3)) / 3);
          break;
        }
      }
    }

    // add debug calculations to buffer
    attacker.combatData.buffer += `\n<b><yellow>Wpn Dmg</yellow></b>: <b>${min.toFixed(2)} - ${max.toFixed(2)}</b> (<green>${discName}</green>: <b><magenta>${weaponMastery}</b>%</magenta>) (<green>Brawn</green>: <b><magenta>${brawn}</b></magenta>)\n`;
    attacker.combatData.buffer += ` [<yellow>${formula}</yellow>]\n`;

    return {
      max,
      min
    };
  }

  /**
   * Select a random value within the damage range for a character's equipped weapon(s)
   * @param {Character} attacker
   * @param {boolean} average Whether to find the average or a random between min/max
   * @return {number}
   */
  static calculateWeaponDamage(attacker, average = false) {
    // get the damage range for the character's equipped weapon(s)
    let weaponDamage = this.getWeaponDamage(attacker);
    let amount = 0;
    if (average) {
      amount = (weaponDamage.min + weaponDamage.max) / 2;
    } else {
      // roll for a random value within that range
      amount = RandomUtil.inRange(weaponDamage.min, weaponDamage.max);
    }

    // add debug calculations to buffer
    attacker.combatData.buffer += ` <b><cyan>DAMAGE</cyan></b>: <b><white>${amount}</white></b> [<yellow>rolled</yellow>]\n`;

    return this.normalizeWeaponDamage(attacker, amount);
  }

  /**
   * Get the speed of the currently equipped weapon(s)
   * @param {Character} attacker
   * @return {number}
   */
  static getWeaponSpeed(attacker) {
    const weapon = attacker.equipment.get('wield');
    const reflexes = attacker.getAttribute('reflexes') || 0;
    let speed = 5,
    discName,
    weaponMastery,
    formula;

    // if attacker is unarmed
    if (!weapon) {
      discName = 'Unarmed';
      weaponMastery = attacker.getAttribute('unarmed') || 0;
      formula = `${speed.toFixed(2)} - (unarmed / 100) - (reflexes / 250)`;
    } else {
      switch (weapon.metadata.type) {
        // if attacker is using a blade weapon
        case 'blade': {
          discName = 'Blades';
          speed = speed + (weapon.metadata.lag / 10)
          weaponMastery = attacker.getAttribute('blades') || 0;
          formula = `${speed.toFixed(2)} - (blades / 150) - (reflexes / 250)`;
          break;
        }
        // if attacker is using a club weapon
        case 'club': {
          discName = 'Clubs';
          speed = speed + (weapon.metadata.lag / 8)
          weaponMastery = attacker.getAttribute('clubs') || 0;
          formula = `${speed.toFixed(2)} - (clubs / 150) - (reflexes / 250)`;
          break;
        }
        // if attacker is using a polearm weapon
        case 'polearm': {
          discName = 'Polearms';
          speed = speed + (weapon.metadata.lag / 6)
          weaponMastery = attacker.getAttribute('polearms') || 0;
          formula = `${speed.toFixed(2)} - (polearms / 150) - (reflexes / 250)`;
          break;
        }
      }
    }

    speed = (speed - (weaponMastery / 150) - (reflexes / 250)).toFixed(2);

    // add debug calculations to buffer
    attacker.combatData.buffer += `<b><yellow>Wpn Spd</yellow></b>: <b>${speed}</b> (<green>${discName}</green>: <b><magenta>${weaponMastery}</b>%</magenta>) (<green>Reflexes</green>: <b><magenta>${reflexes}</b></magenta>) [<yellow>${formula}</yellow>]\n`;

    return speed;
  }

  /**
   * Normalize baseline weapon damage by character's attributes and skills
   * @param {Character} attacker
   * @param {number} amount
   * @return {number}
   */
  static normalizeWeaponDamage(attacker, amount) {
    // account for discs and attributes
    const offense = attacker.getAttribute('offense') || 0;
    const brawn = attacker.getAttribute('brawn') || 0;
    const reflexes = attacker.getAttribute('reflexes') || 0;
    const endurance = attacker.getAttribute('endurance') || 0;
    const speed = this.getWeaponSpeed(attacker);
    let total = amount;

    const formula = 'DMG + (((brw/2) + (ref/3) + (end/5)) + (offense / 3)) / (wepSpd / 2))';

    const bonus = ((brawn/2) + (reflexes/3) + (endurance/5)) + (offense / 3);
    total += bonus;

    total = Math.round(total / (speed / 2));

    // add debug calculations to buffer
    attacker.combatData.buffer += `<b><cyan>   NORM</cyan></b>: <b><white>${total}</white></b> (<green>Brawn</green>: <b><magenta>${brawn}</b></magenta>) (<green>Reflexes</green>: <b><magenta>${reflexes}</b></magenta>) (<green>Endurance</green>: <b><magenta>${endurance}</b></magenta>) (<green>Offense</green>: <b><magenta>${offense}</b>%</magenta>)\n`;
    attacker.combatData.buffer += ` [<yellow>${formula}</yellow>]`;

    return total;
  }

  /**
   * Any cleanup that has to be done if the character is killed
   * @param {state}      state
   * @param {Character}  deadEntity
   * @param {?Character} killer Optionally the character that killed the dead entity
   */
  static handleDeath(state, deadEntity, killer) {
    deadEntity.removeFromCombat();
    deadEntity.combatData.meta = null;

    killer = killer || deadEntity.combatData.killedBy;
    Logger.log(`${killer ? killer.name : 'Something'} killed ${deadEntity.name}.`);


    if (killer) {
      killer.emit('deathblow', deadEntity);
    }
    deadEntity.emit('killed', killer);

    if (deadEntity.isNpc) {
      const area = state.AreaManager.getArea(deadEntity.source.area);
      const room = area.getRoomById(deadEntity.source.room);
      room.removeSpawnedNpc(deadEntity);
      
      state.NpcManager.remove(deadEntity);
      deadEntity.room.removeNpc(deadEntity);
    }
  }

  /**
   * Begin a slow, natural regeneration process after combat
   * @param {GameState} state
   * @param {Entity} entity
   */
  static regenerateAfterCombat(state, entity) {
    // if they're already regenerating, skip
    if (entity.hasEffectType('regen')) {
      return;
    }

    // otherwise, apply a hidden regen effect for health, energy, mana, and favor
    let regenEffect = state.EffectFactory.create('regen', entity, { hidden: true });
    if (entity.addEffect(regenEffect)) {
      regenEffect.activate();
    }
  }

  /**
   * Find an eligible target in the room and add it to the attacker's combatant list
   * @param {string} args
   * @param {Player} player
   * @return {Entity|null} Found entity... or not.
   */
  static findCombatant(attacker, search) {
    if (!search.length) {
      return null;
    }

    let possibleTargets = [...attacker.room.npcs];
    if (attacker.getMeta('pvp')) {
      possibleTargets = [...possibleTargets, ...attacker.room.players];
    }

    const target = Parser.parseDot(search, possibleTargets);

    if (!target) {
      return null;
    }

    if (target === attacker) {
      throw new CombatErrors.CombatSelfError("Your sense of self preservation stops you.");
    }

    if (!target.hasAttribute('health')) {
      throw new CombatErrors.CombatInvalidTargetError("You can't attack that target");
    }

    if (!target.isNpc && !target.getMeta('pvp')) {
      throw new CombatErrors.CombatNonPvpError(`${target.name} has not opted into PvP.`, target);
    }

    if (target.getMeta('pacifist')) {
      throw new CombatErrors.CombatPacifistError(`${target.name} is a pacifist and will not fight you.`, target);
    }

    return target;
  }
}

module.exports = Combat;
