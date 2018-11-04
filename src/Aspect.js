'use strict';

/**
 * Representation of an aspect for a character
 */
class Aspect {
  /**
   * @param {String} name   Name of aspect
   * @param {Object} config Script file exports for aspect
   */
  constructor(config) {
    Object.assign(this, config);
  }
}

module.exports = Aspect;
