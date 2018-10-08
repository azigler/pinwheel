'use strict';

/**
 * Representation of an inventory inside a `Character` or `Item`
 * @extends Map
 */
class Inventory extends Map {
  /**
   * @param {Array<Item>} items Array of items in the inventory
   * @param {number} maxItems Max number of items this inventory can hold
   */
  constructor(items = [], maxItems = null) {
    super(items);
    this.maxItems = maxItems;
  }

  /**
   * Set max number of items this inventory can hold
   * @param {number} size
   */
  setMax(size) {
    this.maxItems = size;
  }

  /**
   * Get max number of items this inventory can hold
   * @return {number}
   */
  getMax() {
    return this.maxItems;
  }

  /**
   * Whether this inventory is at or beyond its maximum capacity
   * @return {boolean}
   */
  get isFull() {
    if (this.maxItems === null) {
      return true;
    }
    return this.size >= this.maxItems;
  }

  /**
   * Add item to inventory
   * @param {Item} item
   */
  addItem(item) {
    // only throw this error if adding beyond the maximum capacity
    if (this.isFull && this.size !== this.maxItems) {
      throw new InventoryFullError();
    }
    this.set(item.uuid, item);
  }

  /**
   * Remove item from inventory
   * @param {Item} item
   */
  removeItem(item) {
    this.delete(item.uuid);
  }

  /**
   * Gather data to be persisted
   * @return {Object}
   */
  serialize() {
    // Item is imported here to prevent circular dependency with Item having an Inventory
    const Item = require('./Item');

    let data = {
      items: [],
      maxItems: this.maxItems
    };

    for (const [uuid, item] of this) {
      if (!(item instanceof Item)) {
        this.delete(uuid);
        continue;
      }

      data.items.push([uuid, item.serialize()]);
    }

    return data;
  }

  /**
   * Hydrate the inventory for its owner
   * @param {GameState} state
   * @param {Object}    owner
   */
  hydrate(state, owner) {
    // Item is imported here to prevent circular dependency with Item having an Inventory
    const Item = require('./Item');
    this.maxItems = owner.maxItems || null;
    
    // for each item in this inventory
    for (const [uuid, item] of this) {
      // if the item has already been initialized
      if (item instanceof Item) {
        // assign the item's owner
        item.belongsTo = owner;
        continue;
      }

      // exit if item does not have a valid entity reference
      if (!item.entityReference) {
        continue;
      }

      // create and hydrate the item
      const area = state.AreaManager.getAreaByReference(item.entityReference);
      let newItem = state.ItemFactory.create(area, item.entityReference);
      newItem.uuid = uuid;
      newItem.belongsTo = owner;
      newItem.hydrate(state, item);
      this.set(uuid, newItem);
      state.ItemManager.add(newItem);
    }
  }
}

/**
 * @extends Error
 */
class InventoryFullError extends Error {}

module.exports = { Inventory, InventoryFullError };
