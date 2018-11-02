'use strict';

const Damage = require('./Damage');

/**
 * Heal is `Damage` that raises an attribute instead of lowering it
 * 
 * @property {Character} healer Character causing the heal, same as attacker in Damage
 * 
 * @extends Damage
 */
class Heal extends Damage {
  /**
   * @param {Object} config
   * 
   */
  constructor(config) {
    super(config);
    this.healer = this.attacker;
  }

  /**
   * Evaluate actual heal taking attacker/target's effects into account
   * @param {Character} target
   * @return {number} Final heal amount
   */
  evaluate(target) {
    let amount = this.amount;

    if (this.attacker) {
      amount = this.attacker.evaluateOutgoingDamage(this, amount);
    }

    return target.evaluateIncomingDamage(this, amount);
  }

  /**
   * Raise a given attribute
   * @param {Character} target
   * @fires Character#heal
   * @fires Character#healed
   */
  commit(target) {
    this.finalAmount = this.evaluate(target);
    target.raiseAttribute(this.attribute, this.finalAmount);
    if (this.attacker) {
      /**
       * @event Character#heal
       * @param {Heal} heal
       * @param {Character} target
       */
      this.attacker.emit('heal', this, target);
    }
    /**
     * @event Character#healed
     * @param {Heal} heal
     */
    target.emit('healed', this);
  }
}

module.exports = Heal;
