'use strict';

const Archetype = require('./Archetype');

/**
 * Keep track of every archetype in the game
 */
class ArchetypeManager extends Map {
  constructor() {
    super();
  }

  /**
   * Get archetype by name
   * @param {string} name
   * @return {Archetype}
   */
  getArchetype(name) {
    return this.get(name);
  }

  /**
   * Add archetype to manager
   * @param {String}      name
   * @param {Archetype}   archetype
   */
  addArchetype(name, archetype) {
    this.set(name, archetype);
  }

  /**
   * Remove archetype from manager by name
   * @param {String} name
   */
  removeArchetype(name) {
    this.delete(name);
  }

  /**
   * Attach listeners to a character from an archetype definition
   * @param {state}     state
   * @param {Character} character
   * @param {Archetype} archetype
   */
  attachListeners(state, character, archetype) {
    const arch = this.getArchetype(archetype);
    const archetypeListeners = arch.listeners;
    for (const [eventName, listener] of Object.entries(archetypeListeners)) {
      character.on(eventName, listener(state));
    }
  }

  /**
   * Perform initial archetype setup for a character
   * @param {Character}   character
   * @param {state}       state
   * @param {Archetype}   archetype
   * @return {String}     name of archetype
   */
  setupArchetype(character, state, archetype) {
    const arch = this.getArchetype(archetype);
    arch.setup(character);

    return arch.name;
  }
}

module.exports = ArchetypeManager;
