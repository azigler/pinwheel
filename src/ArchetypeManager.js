'use strict';

const Archetype = require('./Archetype');

/**
 * Keep track of every archetype in the game
 * 
 * @extends Map
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

    for (const attr in arch.attributeTable) {
      if (character.hasAttribute(attr)) {
        const current = character.getAttribute(attr);
        const val = arch.attributeTable[attr];
        character.setAttributeBase(attr, current + val);
      } else {
        character.addAttribute(attr, arch.attributeTable[attr]);
      }
    }
    for (const skill in arch.skillTable) {
      if (character.hasAttribute(skill)) {
        const current = character.getAttribute(skill);
        const val = arch.skillTable[skill];
        character.setAttributeBase(skill, current + val);
      } else {
        character.addSkill(skill, arch.skillTable[skill]);
      }
    }

    return arch.name;
  }
}

module.exports = ArchetypeManager;
