'use strict';

/**
 * Keep track of all individual in-game NPCs
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
