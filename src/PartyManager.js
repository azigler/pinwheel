'use strict';

const Party = require('./Party');

/**
 * Keep track of active parties
 * @extends Set
 */
class PartyManager extends Set {
  /**
   * Create a new party with a given leader
   * @param {Player} leader
   */
  create(leader) {
    const party = new Party(leader);
    this.add(party);
  }

  /**
   * Disband a party
   * @param {Party} party
   */
  disband(party) {
    this.delete(party);
    party.disband();
    party = null;
  }
}

module.exports = PartyManager;
