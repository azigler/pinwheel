'use strict';

const Character = require('./Character');
const Room = require('./Room');

/**
 * Keep track of all in-game items
 * 
 * @extends Set
 */
class ItemManager extends Set {
  /**
   * Remove an item
   * @param {Item}      item
   * @param {GameState} state
   */
  remove(item, state) {
    if (item.belongsTo) {
      item.belongsTo.removeItem(item);
    }
    
    if (item.source) {
      const sourceArea = state.AreaManager.getArea(item.source.area);
      const sourceRoom = sourceArea.getRoomById(item.source.room);
      sourceRoom.removeSpawnedItem(item);
    }

    if (item.inventory) {
      item.inventory.forEach(childItem => this.remove(childItem));
    }

    this.delete(item);
  }

  /**
   * Apply `updateTick` to all items in the game
   * @fires Item#updateTick
   */
  tickAll() {
    for (const item of this) {
      /**
       * @event Item#updateTick
       */
      item.emit('updateTick');
    }
  }
}

module.exports = ItemManager;
