'use strict';

/**
 * Stores references to, and handles distribution of, active areas
 * @property {Map<string,Area>} areas
 */
class AreaManager extends Map {
  /**
   * @param {string} name
   * @return Area
   */
  getArea(name) {
    return this.get(name);
  }

  /**
   * @param {string} entityRef
   * @return Area
   */
  getAreaByReference(entityRef) {
    const [ name ] = entityRef.split(':');
    return this.getArea(name);
  }

  /**
   * @param {Area} area
   */
  addArea(area) {
    this.set(area.name, area);
  }

  /**
   * @param {Area} area
   */
  removeArea(area) {
    this.delete(area.name);
  }

  /**
   * Apply `updateTick` to all areas in the game
   * @param {GameState} state
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
      for (const [ roomId, room ] of area.rooms) {
        room.hydrate(state);
      }
    }
  }
}

module.exports = AreaManager;
