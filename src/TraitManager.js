'use strict';

const Trait = require('./Trait');

/**
 * Keep track of every trait in the game
 */
class TraitManager extends Map {
  constructor() {
    super();
  }

  /**
   * Get trait by name
   * @param {string} name
   * @return {Trait}
   */
  getTrait(name) {
    return this.get(name);
  }

  /**
   * Add trait to manager
   * @param {String}    name
   * @param {Trait}     trait
   */
  addTrait(name, trait) {
    this.set(name, trait);
  }

  /**
   * Remove Trait from manager by name
   * @param {String}    name
   */
  removeTrait(name) {
    this.delete(name);
  }

  /**
   * Attach listeners to a character from a trait definition
   * @param {state}     state
   * @param {Character} character
   * @param {Trait}     trait
   */
  attachListeners(state, character, trait) {
    const ts = this.getTrait(trait);
    const traitListeners = ts.listeners;
    for (const [eventName, listener] of Object.entries(traitListeners)) {
      character.on(eventName, listener(state));
    }
  }

  /**
   * Perform initial trait setup for a character
   * @param {Character}  character
   * @param {state}      state
   * @param {Trait}      trait
   * @return {String}    name of trait
   */
  setupTrait(character, state, trait) {
    const ts = this.getTrait(trait);
    ts.setup(character);

    for (const attr in ts.attributeTable) {
      if (character.hasAttribute(attr)) {
        const current = character.getAttribute(attr);
        const val = ts.attributeTable[attr];
        character.setAttributeBase(attr, current + val);
      } else {
        character.addAttribute(attr, ts.attributeTable[attr]);
      }
    }
    for (const skill in ts.skillTable) {
      if (character.hasAttribute(skill)) {
        const current = character.getAttribute(skill);
        const val = ts.skillTable[skill];
        character.setAttributeBase(skill, current + val);
      } else {
        character.addSkill(skill, ts.skillTable[skill]);
      }
    }

    return ts.name;
  }
}

module.exports = TraitManager;
