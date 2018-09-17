'use strict';

const Room = require('./Room');

/**
 * Keeps track of every room in the game
 * @property {string} startingRoom Entity reference of the room that players should spawn in when created
 */
class RoomManager extends Map {
  constructor() {
    super();
    // the actual starting room is loaded from `pinwheel.json` by BundleManager via Config
    this.startingRoom = null;
  }

  /**
   * Get room by entity reference
   * @param {string} entityRef
   * @return {Room}
   */
  getRoom(entityRef) {
    return this.get(entityRef);
  }

  /**
   * Add room to manager
   * @param {Room} room
   */
  addRoom(room) {
    this.set(room.entityReference, room);
  }

  /**
   * Remove room from manager
   * @param {Room} room
   */
  removeRoom(room) {
    this.delete(room.entityReference);
  }

  /**
   * Get the exit definition of a room's exit by searching for the exit name
   * @param {Room}   room
   * @param {string} exitName exit name to search
   * @return {false|Object}
   */
  findExit(room, exitName) {
    const exits = Array.from(room.exits).filter(e => e.direction.indexOf(exitName) === 0);

    if (!exits.length) {
      return false;
    }

    if (exits.length > 1) {
      return false;
    }

    return exits.pop();
  }
}

module.exports = RoomManager;
