'use strict';

const Feat = require('./Feat');

/**
 * Keep track of every feat in the game
 */
class FeatManager extends Map {
  constructor() {
    super();
  }

  /**
   * Get feat by name
   * @param {string} name
   * @return {Feat}
   */
  getFeat(name) {
    return this.get(name);
  }

  /**
   * Add feat to manager
   * @param {String}      name
   * @param {Feat}        feat
   */
  addFeat(name, feat) {
    this.set(name, feat);
  }

  /**
   * Remove Feat from manager by name
   * @param {String} name
   */
  removeFeat(name) {
    this.delete(name);
  }

  /**
   * Attach listeners to a character from a feat definition
   * @param {state}     state
   * @param {Character} character
   * @param {Feat} feat
   */
  attachListeners(state, character, feat) {
    const ft = this.getFeat(feat);
    const featListeners = ft.listeners;
    for (const [eventName, listener] of Object.entries(featListeners)) {
      character.on(eventName, listener(state));
    }
  }

  /**
   * Perform initial feat setup for a character
   * @param {Character}   character
   * @param {state}       state
   * @param {Feat}        feat
   * @return {String}     name of feat
   */
  setupFeat(character, state, feat) {
    const ft = this.getFeat(feat);
    ft.setup(character);

    return ft.name;
  }
}

module.exports = FeatManager;
