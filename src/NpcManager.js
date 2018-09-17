'use strict';

/**
 * Keeps track of all the individual NPCs in the game
 */
class NpcManager extends Map {
  /**
   * @param {Mob} mob
   */
  addNpc(mob) {
    this.set(mob.uuid, mob);
  }

  /**
   * @param {Mob} mob
   */
  removeNpc(mob) {
    this.delete(mob.uuid);
  }
}

module.exports = NpcManager;
