'use strict';

const Aspect = require('./Aspect');

/**
 * Keep track of every aspect in the game
 * 
 * @extends Map
 */
class AspectManager extends Map {
  constructor() {
    super();
  }

  /**
   * Get aspect by name
   * @param {string} name
   * @return {Aspect}
   */
  getAspect(name) {
    return this.get(name);
  }

  /**
   * Add aspect to manager
   * @param {String}      name
   * @param {Aspect}      aspect
   */
  addAspect(name, aspect) {
    this.set(name, aspect);
  }

  /**
   * Remove aspect from manager by name
   * @param {String} name
   */
  removeAspect(name) {
    this.delete(name);
  }

  /**
   * Attach listeners to a character from an aspect definition
   * @param {state}     state
   * @param {Character} character
   * @param {string}    aspect      Name of aspect to set up
   */
  attachListeners(state, character, aspect) {
    const asp = this.getAspect(aspect);

    if (asp.listeners) {
      const aspectListeners = asp.listeners;
      for (const [eventName, listener] of Object.entries(aspectListeners)) {
        character.on(eventName, listener(state));
      }
    }
  }

  /**
   * Perform initial aspect setup for a character
   * @param {Character}   character
   * @param {state}       state
   * @param {string}      aspect    Name of aspect to set up
   * @return {string}               Name of aspect
   */
  setupAspect(character, state, aspect) {
    const asp = this.getAspect(aspect);
    asp.setup(character);

    for (const attr in asp.attributeTable) {
      if (character.hasAttribute(attr)) {
        const current = character.getAttribute(attr);
        const val = asp.attributeTable[attr];
        character.setAttributeBase(attr, current + val);
      } else {
        character.addAttribute(attr, asp.attributeTable[attr]);
      }
    }
    for (const skill in asp.skillTable) {
      if (character.hasAttribute(skill)) {
        const current = character.getAttribute(skill);
        const val = asp.skillTable[skill];
        character.setAttributeBase(skill, current + val);
      } else {
        character.addSkill(skill, asp.skillTable[skill]);
      }
    }

    return asp.name;
  }
}

module.exports = AspectManager;
