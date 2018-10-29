'use strict';

const Item = require('./Item');
const EntityFactory = require('./EntityFactory');

/**
 * Stores definitions of items to allow for easy creation and cloning
 * 
 * @extends EntityFactory
 */
class ItemFactory extends EntityFactory {
  /**
   * Create a new instance of an item by EntityReference. Resulting item will
   * not be held or equipped and will _not_ have its default contents. The
   * item will _not_ have its contents until it is hydrated.
   * @param {Area}   area
   * @param {string} entityRef
   * @return {Item}
   */
  create(area, entityRef) {
    const item = this.createByType(area, entityRef, Item);
    item.area = area;
    return item;
  }
}

module.exports = ItemFactory;
