'use strict';

/**
 * Keep track of all the individual NPCs in the game
 */
class NpcManager extends Map {
  /**
   * @param {Npc} npc
   */
  add(npc) {
    this.set(npc.uuid, npc);
  }

  /**
   * @param {Npc} npc
   */
  remove(npc) {
    this.delete(npc.uuid);
  }
}

module.exports = NpcManager;
