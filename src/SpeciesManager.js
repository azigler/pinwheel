'use strict';

const Species = require('./Species');

/**
 * Keep track of every species in the game
 */
class SpeciesManager extends Map {
  constructor() {
    super();
  }

  /**
   * Get species by name
   * @param {string} name
   * @return {Species}
   */
  getSpecies(name) {
    return this.get(name);
  }

  /**
   * Add species to manager
   * @param {String}    name
   * @param {Species}   species
   */
  addSpecies(name, species) {
    this.set(name, species);
  }

  /**
   * Remove species from manager by name
   * @param {String} name
   */
  removeSpecies(name) {
    this.delete(name);
  }

  /**
   * Attach listeners to a character from its species definition
   * @param {state}     state
   * @param {Character} character
   */
  attachListeners(state, character) {
    const species = this.getSpecies(character.species);
    const speciesListeners = species.listeners;
    for (const [eventName, listener] of Object.entries(speciesListeners)) {
      character.on(eventName, listener(state));
    }
  }

  /**
   * Perform initial species setup for a character
   * @param {Character}   character
   * @return {String}     name of species
   */
  setupSpecies(character, state) {
    const species = this.getSpecies(character.species);
    species.setup(character);

    return species.name;
  }
}

module.exports = SpeciesManager;
