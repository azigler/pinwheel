'use strict';

const ItemType = require('./ItemType');

/**
 * Keep track of all items in game
 */
class ItemManager extends Set {
  remove(item) {
    if (item.room) {
      item.room.removeItem(item);
    }

    if (item.belongsTo) {
      item.belongsTo.removeItem(item);
    }

    if (item.type === ItemType.CONTAINER && item.inventory) {
      item.inventory.forEach(childItem => this.remove(childItem));
    }

    this.items.delete(item);
  }

  /**
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
