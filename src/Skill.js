'use strict';

const SkillFlag = require('./SkillFlag');
const SkillType = require('./SkillType');
const SkillErrors = require('./Error/SkillErrors');
const SkillUtil = require('./Util/SkillUtil');
const Damage = require('./Damage');

/**
 * Representation of a skill
 * 
 * @property {string}             id                Filename of skill definition
 * @property {string}             name              Name of skill
 * @property {GameState}          state             Game state
 * @property {?SkillType}         type              Type of skill
 * @property {?Object}            options           Options for skill
 * @property {?Array<SkillFlag>}  flags             Array of skill flags
 * @property {?function (Effect)} configureEffect   Function to modify the skill's effect before adding to player (passive only)
 * @property {?string}            effect            Id (filename) of the passive effect for this skill (passive only)
 * @property {?Object<attribute: string, cost: number>} resource Object representing resource cost for skill
 * @property {?boolean}           initiatesCombat   Whether this skill initiates combat when used
 * @property {?boolean}           requiresTarget    Whether this skill requires a target
 * @property {?boolean}           targetSelf        Whether this skill targets the user
 * @property {string}             cooldownGroup     Name of cooldown group (used to apply cooldowns to skill groups) for skill
 * @property {null|number}        cooldownLength    When > 0, apply a cooldown effect to disallow usage of this skill
 * @property {function ()}        info              Function that displays extra information about this skill
 * @property {function ()}        run               Function to run when skill is executed/activated
 * 
 */
class Skill {
  constructor(id, def, state) {
    // validate loaded skill
    const required = ['name'];
    for (const prop of required) {
      if (!(prop in def)) {
        throw new ReferenceError(`Skill [${id}] missing required property: ${prop}`);
      }
    }

    // assign required properties
    this.id = id;
    this.name = def.name;
    this.state = state;

    // assign remaining properties
    this.type = def.type || SkillType.ABILITY;
    this.options = def.options || {};
    this.flags = def.flags || [];
    this.configureEffect = def.configureEffect || (_ => _);
    this.effect = def.effect || null;
    this.resource = def.resource || null;
    this.initiatesCombat = def.initiatesCombat || false;
    this.requiresTarget = def.requiresTarget || true;
    this.targetSelf = def.targetSelf || false;

    // define skill branches
    this.branches = def.branches;

    // define cooldown properties
    this.cooldownGroup = null;
    if (def.cooldown && typeof def.cooldown === 'object') {
      this.cooldownGroup = def.cooldown.group;
      this.cooldownLength = def.cooldown.length;
    } else {
      this.cooldownLength = def.cooldown;
    }

    // bind info and run functions to the skill
    const {
      info = _ => {},
      run = _ => {},
    } = def;
    this.info = info.bind(this);
    this.run = run.bind(this);
  }

  /**
   * Getter for this skill's cooldown id
   * @type {string}
   */
  get cooldownId() {
    return this.cooldownGroup ? "skillgroup:" + this.cooldownGroup : "skill:" + this.id;
  }

  /**
   * Whether a character has enough resources to use this skill
   * @param {Character} character
   * @return {boolean}
   */
  hasEnoughResources(character) {
    // resource checking helper function
    const hasEnoughResource = function(character, resource) {
      return !resource.cost || (
        character.hasAttribute(resource.attribute) &&
        character.getAttribute(resource.attribute) >= resource.cost
      );
    }

    // if required resources are an array, check each entry
    if (Array.isArray(this.resource)) {
      return this.resource.every((resource) => hasEnoughResource(character, resource));
    }

    // check the resource on the character
    return hasEnoughResource(character, this.resource);
  }

  /**
   * Pay the resource costs for this skill for a character
   * @param {Character} character
   * @return {boolean} If the character has paid the resource costs
   */
  payResourceCosts(character) {
    // resource cost helper function
    const payResourceCost = function(character, resource) {
      // Resource cost is calculated as damage so effects could potentially reduce resource costs
      const damage = new Damage({
        attribute: resource.attribute,
        amount: resource.cost,
        attacker: null,
        hidden: true,
        source: this
      });

      damage.commit(character);
    }
    
    const hasMultipleResourceCosts = Array.isArray(this.resource);
    if (hasMultipleResourceCosts) {
      for (const resourceCost of this.resource) {
        payResourceCost(character, resourceCost);
      }
      return true;
    }

    return payResourceCost(character, this.resource);
  }

  /**
   * Execute an active skill
   * @param {string} args
   * @param {Character} character
   * @param {Character} target
   */
  execute(args, character, target) {
    // if skill is passive
    if (this.flags.includes(SkillFlag.PASSIVE)) {
      throw new SkillErrors.PassiveError();
    }

    // if skill is on cooldown
    const cdEffect = this.onCooldown(character);
    if (this.cooldownLength && cdEffect) {
      throw new SkillErrors.CooldownError(cdEffect);
    }

    // if the character doesn't have enough resources
    if (this.resource) {
      if (!this.hasEnoughResources(character)) {
        throw new SkillErrors.NotEnoughResourcesError();
      }
    }

    // if the character doesn't target itself and this skill initiates combat
    if (target !== character && this.initiatesCombat) {
      // initiate combat with the target
      character.initiateCombat(target);
    }

    // if the skill's `run` function doesn't return false
    if (this.run(args, character, target) !== false) {
      // apply the cooldown to the character
      this.cooldown(character);
      // if this skill requires resources
      if (this.resource) {
        // pay the character's resource costs for this skill
        this.payResourceCosts(character);
      }
    }
    
    // calculate skill gain chance
    SkillUtil.calculateSkillGain(character, this.name);

    return true;
  }

  /**
   * Activate a passive skill
   * @param {Character} character
   */
  activate(character) {
    if (!this.flags.includes(SkillFlag.PASSIVE)) {
      return;
    }

    if (!this.effect) {
      throw new Error('Passive skill has no attached effect');
    }


    let effect = this.state.EffectFactory.create(this.effect, character, { description: this.info(character), skill: this });
    effect = this.configureEffect(effect);
    character.addEffect(effect);
    this.run(character);
  }

  /**
   * Whether this skill is on cooldown for the character
   * @param {Character} character
   * @return {boolean|Effect} Returns false or the cooldown effect
   */
  onCooldown(character) {
    for (const effect of character.effects.entries()) {
      if (effect.id === 'cooldown' && effect.state.cooldownId === this.cooldownId) {
        return effect;
      }
    }

    return false;
  }

  /**
   * Apply a cooldown from this skill on a character
   * @param {number}    duration  Cooldown duration
   * @param {Character} character
   */
  cooldown(character) {
    // if this skill doesn't have a cooldown time
    if (!this.cooldownLength) {
      return;
    }

    // create the cooldown effect
    const effect = this.state.EffectFactory.create(
      'cooldown',
      character,
      { name: "Cooldown: " + this.name, duration: this.cooldownLength * 1000, skill: this },
      { cooldownId: this.cooldownId }
    );

    // apply the cooldown to the character
    character.addEffect(effect);
  }
}

module.exports = Skill;
