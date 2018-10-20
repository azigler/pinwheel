'use strict';

/**
 * Representation of a party of characters
 * 
 * @property {Character} leader
 * 
 * @implements {Broadcastable}
 */
class Party extends Set {
  constructor(leader) {
    super();
    this.invited = new Set();
    this.leader = leader;
    this.add(leader);
  }

  /**
   * Delete a party member
   * @property {Character} member
   */
  delete(member) {
    super.delete(member);
    member.party = null;
  }

  /**
   * Add a target character to the party
   * @property {Character} target
   */
  add(target) {
    super.add(target);
    target.party = this;
    this.invited.delete(target);
  }

  /**
   * Disband the party
   */
  disband() {
    for (const member of this) {
      this.delete(member);
    }
  }

  /**
   * Invite the target character to the party
   * @property {Character} target
   */
  invite(target) {
    this.invited.add(target);
  }

  /**
   * Whether the target character is currently invited to the party
   * @property {Character} target
   */
  isInvited(target) {
    return this.invited.has(target);
  }

  /**
   * Rescind a party invitation from the target character
   * @property {Character} target
   */
  removeInvite(target) {
    this.invited.delete(target);
  }

  /**
   * Used by Broadcast
   * @see {@link Broadcastable}
   * @see {@link Broadcast}
   * @return {Array<Character>}
   */
  getBroadcastTargets() {
    return [...this];
  }
}

module.exports = Party;
