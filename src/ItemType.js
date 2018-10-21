'use strict';

/**
 * @enum {Symbol}
 */
const ItemType = {
  WEARABLE: Symbol("WEARABLE"),
  CONTAINER: Symbol("CONTAINER"),
  OBJECT: Symbol("OBJECT"),
  CONSUMABLE: Symbol("CONSUMABLE"),
  WEAPON: Symbol("WEAPON"),
  RESOURCE: Symbol("RESOURCE"),
  TOOL: Symbol("TOOL"),
  SCENERY: Symbol("SCENERY")
};

module.exports = ItemType;
