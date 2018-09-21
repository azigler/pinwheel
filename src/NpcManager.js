'use strict';

/**
 * Keeps track of all the individual NPCs in the game
 */
class NpcManager extends Map {
  /**
   * @param {Mob} mob
   */
  add(mob) {
    this.set(mob.uuid, mob);
  }

  /**
   * @param {Mob} mob
   */
  remove(mob) {
    this.delete(mob.uuid);
  }
}

module.exports = NpcManager;
