'use strict';

/**
 * Keep track of all individual in-game NPCs
 * 
 * @extends Map
 */
class NpcManager extends Map {
  /**
   * Add an NPC
   * @param {Npc} npc
   */
  add(npc) {
    this.set(npc.uuid, npc);
  }

  /**
   * Remove an NPC
   * @param {Npc} npc
   */
  remove(npc) {
    this.delete(npc.uuid);
  }
}

module.exports = NpcManager;
