'use strict';

const Data = require('./Data');

/**
 * Store references of active areas and handle state
 * @property {Map<string,Area>} areas
 */
class AreaManager extends Map {
  /**
   * Get an area by name
   * @param {string} name
   * @return Area
   */
  getArea(name) {
    return this.get(name);
  }

  /**
   * Get an area by entity reference
   * @param {string} entityRef
   * @return Area
   */
  getAreaByReference(entityRef) {
    const [ name ] = entityRef.split(':');
    return this.getArea(name);
  }

  /**
   * Add an area to the manager
   * @param {Area} area
   */
  addArea(area) {
    this.set(area.name, area);
  }

  /**
   * Remove an area from the manager
   * @param {Area} area
   */
  removeArea(area) {
    this.delete(area.name);
  }

  /**
   * Apply `updateTick` to all areas in the game
   * @param {GameState} state
   * @fires Area#updateTick
   */
  tickAll(state) {
    for (const [ name, area ] of this) {
      area.emit('updateTick', state);
    }
  }

  /**
   * Hydrate all rooms in all areas
   * @param {GameState} state
   */
  distribute(state) {
    for (const [ name, area ] of this) {
      // hydrate area
      let data = null;
      if (Data.exists('area', name)) {
        data = Data.load('area', name);
        area.hydrate(state, data);
      } else {
        area.hydrate(state);
      }
      for (const [ roomId, room ] of area.rooms) {
        // hydrate room
        if (data !== null) {
          room.hydrate(state, data[roomId]);
        } else {
          room.hydrate(state);
        }
      }
    }
  }
}

module.exports = AreaManager;
