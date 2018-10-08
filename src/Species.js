'use strict';

/**
 * Representation of a species
 */
class Species {
  /**
   * @param {String} name   Name of species
   * @param {Object} config Script file exports for species
   */
  constructor(config) {
    Object.assign(this, config);
  }
}

module.exports = Species;
