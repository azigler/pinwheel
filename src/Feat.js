'use strict';

/**
 * Representation of a feat
 */
class Feat {
  /**
   * @param {String} name   Name of feat
   * @param {Object} config Script file exports for feat
   */
  constructor(config) {
    Object.assign(this, config);
  }
}

module.exports = Feat;
