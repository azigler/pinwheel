'use strict';

/**
 * Representation of an "Attribute" which is any value that has a base amount and depleted/restored
 * safely. Where safely means without being destructive to the base value.
 *
 * An attribute on its own cannot be raised above its base value.
 *
 * @property {string} name
 * @property {number} base
 * @property {number} delta Current difference from the base
 */
class Attribute {
  /**
   * @param {string} name
   * @param {number} base
   * @param {number} delta=0
   */
  constructor(name, base, delta = 0) {
    if (isNaN(base)) { 
      throw new TypeError(`Base attribute must be a number, got ${base}.`); 
    }
    if (isNaN(delta)) {
      throw new TypeError(`Attribute delta must be a number, got ${delta}.`);
    }
    this.name = name;
    this.base = base;
    this.delta = delta;
  }

  /**
   * Lower current value
   * @param {number} amount
   */
  lower(amount) {
    this.raise(-amount);
  }

  /**
   * Raise current value
   * @param {number} amount
   */
  raise(amount) {
    const newDelta = this.delta + amount;
    this.delta = newDelta;
  }

  /**
   * Change the base value
   * @param {number} amount
   */
  setBase(amount) {
    this.base = amount;
  }

  /**
   * Bypass raise/lower, directly setting the delta
   * @param {amount}
   */
  setDelta(amount) {
    this.delta = amount;
  }

  serialize() {
    const { delta, base } = this;
    return { delta, base };
  }
}

module.exports = Attribute;
