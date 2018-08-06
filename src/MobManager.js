'use strict';

/**
 * Keeps track of all the individual mobs in the game
 */
class MobManager extends Map {
  /**
   * @param {Mob} mob
   */
  addMob(mob) {
    this.set(mob.uuid, mob);
  }

  /**
   * @param {Mob} mob
   */
  removeMob(mob) {
    this.delete(mob.uuid);
  }
}

module.exports = MobManager;
