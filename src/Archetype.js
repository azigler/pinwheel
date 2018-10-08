'use strict';

/**
 * Representation of an archetype
 */
class Archetype {
  /**
   * @param {String} name   Name of archetype
   * @param {Object} config Script file exports for archetype
   */
  constructor(config) {
    Object.assign(this, config);
  }
}

module.exports = Archetype;
