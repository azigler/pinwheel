'use strict';

/**
 * Representation of a trait
 */
class Trait {
  /**
   * @param {String} name   Name of trait
   * @param {Object} config Script file exports for trait
   */
  constructor(config) {
    Object.assign(this, config);
  }
}

module.exports = Trait;
