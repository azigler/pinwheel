'use strict';

const RandomUtil = require('./Util/RandomUtil');
const SkillUtil = require('./Util/SkillUtil');
const Broadcast = require('./Broadcast');

/**
 * Representation of damage
 * 
 * @property {number}       amount        Initial amount of damage to be done
 * @property {number}       finalAmount   Amount of damage to be done after attacker/defender effects
 * @property {string}       attribute     Attribute the damage is going to apply to
 * @property {?string}      type          Damage type e.g., physical, fire, etc.
 * @property {?string}      source        A damage source identifier. e.g., "skill:kick", "weapon", etc.
 * @property {?Character}   attacker      Character causing the damage
 * @property {boolean}      hidden        Whether this damage is hidden
 * @property {boolean}      critical      Whether this damage is critical
 * @property {number}       criticalMultiplier Amount to multiply by damage, if critical
 */
class Damage {
  constructor(config) {
    // validate config
    if (config.amount === null) {
      throw new TypeError("Damage amount null");
    }
    if (config.attribute === null) {
      throw new TypeError("Damage attribute null");
    }

    // assign required properties
    this.amount = this.finalAmount = config.amount;
    this.attribute = config.attribute;

    // TODO: convert type to enum
    this.type = config.type || 'physical';
    this.source = config.source || null;
    this.attacker = config.attacker || null;
    this.hidden = config.hidden || false;
    this.critical = config.critical || false;
    this.criticalMultiplier = config.criticalMultiplier || 1.5;
  }

  /**
   * Evaluate actual damage taking attacker/target's effects into account
   * @param {Character} target
   * @return {number} Final damage amount
   */
  evaluate(target) {
    const armor = target.getAttribute('armor');
    const defense = target.getAttribute('defense');
    let amount = this.amount - (armor / 6) - (defense / 8);
    const formula = 'damage - (armor / 6) - (defense / 8)'

    let meta;
    if (this.attacker) { meta = this.attacker.combatData.meta; }

    if (this.attacker) {
      const critChance = Math.max(this.attacker.getMaxAttribute('critical'), 0);
      this.critical = RandomUtil.probability(critChance);
      if (this.critical) {
        amount = Math.ceil(amount * this.criticalMultiplier);
      }
      amount = this.attacker.evaluateOutgoingDamage(this, amount);
    }

    // announce debug calculations
    if (meta === 'debug') {
      amount = amount.toFixed(2);
      Broadcast.sayAt(target.room, `<b><red>END DMG</red></b>: <b>${amount}</b> (<green>Armor</green>: <b><magenta>${armor}</b></magenta>) (<green>Defense</green>: <b><magenta>${defense}</b></magenta>) [<yellow>${formula}</yellow>]`);
    }

    return target.evaluateIncomingDamage(this, amount);
  }

  /**
   * Actually lower the attribute
   * @param {Character} target
   * @fires Character#hit
   * @fires Character#damaged
   */
  commit(target) {
    this.finalAmount = this.evaluate(target);
    target.lowerAttribute(this.attribute, this.finalAmount);
    if (this.attacker) {
      /**
       * @event Character#hit
       * @param {Damage} damage
       * @param {Character} target
       */
      this.attacker.emit('hit', this, target);
    }
      /**
       * @event Character#damaged
       * @param {Damage} damage
       */
    target.emit('damaged', this);
    
    // calculate chance to gain defense skill upon hit
    const Heal = require('./Heal');
    if (!this instanceof Heal) {
      SkillUtil.calculateSkillGain(target, 'defense');
    }
  }
}

module.exports = Damage;
