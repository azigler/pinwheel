'use strict';

const EventEmitter = require('events');
const uuid = require('uuid/v4');
const ItemType = require('./ItemType');
const Logger = require('./Logger');
const Metadatable = require('./Metadatable');
const Player = require('./Player');
const Inventory = require('./Inventory');
const HydrationUtil = require('./Util/HydrationUtil');

/**
 * Representation of an item
 * 
 * @property {Area}          area         Area in which the item spawned
 * @property {string}        name         Name shown in inventory and when equipped
 * @property {string}        description  Long description seen when looking at it
 * @property {number}        id           Area-relative id (vnum)
 * @property {string}        entityReference Entity reference for the item
 * @property {Array}         keywords     Array of keywords for the item
 * @property {string}        uuid         UUID differentiating all instances of this item
 * @property {ItemType|string} type       Type of item
 * @property {Map}           behaviors    Map of behaviors for item
 * @property {string}        script       Name of custom script attached to this item
 * @property {Array}         defaultItems Array of default items spawned inside of this item initially
 * @property {number}        maxItems     Maximum number of items that this item can contain
 * @property {Inventory}     inventory    Current items that this item contains
 * @property {string}        roomDesc     Description shown when item is seen in a room
 * @property {boolean}       isEquipped   Whether item is currently equipped
 * @property {boolean}       closeable    Whether item can be closed (Default: false, true if closed or locked is true)
 * @property {boolean}       closed       Whether item is closed
 * @property {boolean}       locked       Whether item is locked
 * @property {entityReference} lockedBy   Entity reference of item that locks/unlocks this item
 * @property {Character|Item|Room} belongsTo Entity that this item belongs to
 * @property {Object}        source       Contains the names of the area and room in which this item spawned
 * 
 * @extends EventEmitter
 * @mixes Metadatable
 */
class Item extends Metadatable(EventEmitter) {
  constructor (area, def) {
    super();

    // validate loaded item
    const required = ['id', 'name', 'description'];
    for (const prop of required) {
      if (!(prop in def)) {
        throw new ReferenceError(`Item in area [${area.name}] missing required property: ${prop}`);
      }
    }

    // assign required properties
    this.area = area;
    this.name = def.name;
    this.description = def.description;
    this.id = def.id;

    // all items have an entityReference set on their definition via EntityFactory's setDefinition method
    this.entityReference = def.entityReference || 'spawn:99';

    // set identifying properties
    this.keywords = def.keywords || this.name.split(' ');
    this.uuid = def.uuid || uuid();
    this.type = typeof def.type === 'string' ? ItemType[def.type] : (def.type || ItemType.OBJECT);

    this.behaviors = new Map(Object.entries(def.behaviors || {}));
    this.script = def.script || '';

    // initialize the item's default items and inventory capacity
    this.inventory = null;
    this.defaultItems = def.items || [];
    this.maxItems = def.maxItems || null;

    // set where the item belongs and its room description
    this.belongsTo = null;
    this.roomDesc = def.roomDesc || this.name;

    // set general item properties (more broad than metadata)
    this.isEquipped  = def.isEquipped || false;
    this.closeable   = def.closeable || def.closed || def.locked || false;
    this.closed      = def.closed || false;
    this.locked      = def.locked || false;
    this.lockedBy    = def.lockedBy || null;

    // set where the item was spawned
    this.source = def.source || null;

    // arbitrary data storage
    // WARNING: values must be JSON.stringify-able
    this.metadata = def.metadata || {};
  }

  /**
   * Create an Inventory object from a serialized inventory
   * @param {Array} items Serialized inventory
   * @param {number} maxItems Maximum number of items this inventory can hold
   */
  initializeInventory(items, maxItems) {
    if (items !== undefined) {
      this.inventory = new Inventory(items, maxItems);
    } else {
      this.inventory = null;
    }
  }

  /**
   * Set up inventory, if not already initialized
   * @private
   */
  _setupInventory() {
    if (!this.inventory) {
      this.inventory = new Inventory([], this.maxItems);
    }
  }

  /**
   * Whether this item's inventory is full
   * @return {boolean}
   */
  isInventoryFull() {
    this._setupInventory();
    return this.inventory.isFull;
  }

  /**
   * Add an item to this item's inventory
   * @param {Item} item
   */
  addItem(item) {
    this._setupInventory();
    item.belongsTo = this;
    this.inventory.addItem(item);
  }

  /**
   * Remove an item from this item's inventory
   * @param {Item} item
   */
  removeItem(item) {
    this.inventory.removeItem(item);
    item.belongsTo = null;
  }

  /**
   * Check if this item has a particular item by entity reference
   * and return that item, if found
   * @param {string} itemReference
   * @return {Item|boolean}
   */
  hasItem(itemReference) {
    for (const [ uuid, item ] of this.inventory) {
      if (item.entityReference === itemReference) {
        return item;
      }
    }

    return false;
  }

  /**
   * Whether the item has the given keyword
   * @param {string} keyword
   * @return {boolean}
   */
  hasKeyword(keyword) {
    return this.keywords.indexOf(keyword) !== -1;
  }

  /**
   * Whether the item has the specified behavior
   * @param {string} name
   * @return {boolean}
   */
  hasBehavior(name) {
    if (!(this.behaviors instanceof Map)) {
        throw new Error("Item has not been hydrated. Cannot access behaviors.");
    }
    return this.behaviors.has(name);
  }

  /**
   * Return the specified behavior
   * @param {string} name
   * @return {*}
   */
  getBehavior(name) {
    if (!(this.behaviors instanceof Map)) {
        throw new Error("Item has not been hydrated. Cannot access behaviors.");
    }
    return this.behaviors.get(name);
  }

  /**
   * Return the entity that has this item in their possession
   * @return {Character|Item} owner
   */
  findOwner() {
    let found = null;
    let owner = this.belongsTo;
    while (owner) {
      if (owner instanceof Player) {
        found = owner;
        break;
      }
      owner = owner.belongsTo;
    }

    return found;
  }

  /**
   * Open this item
   * @fires Item#opened
   */
  open() {
    if (!this.closed) {
      return;
    }

    /**
     * @event Item#opened
     */
    this.emit('opened');
    this.closed = false;
  }

  /**
   * Close this item
   * @fires Item#closed
   */
  close() {
    if (this.closed || !this.closeable) {
      return;
    }

    /**
     * @event Item#closed
     */
    this.emit('closed');
    this.closed = true;
  }

  /**
   * Lock this item
   * @fires Item#locked
   */
  lock() {
    if (this.locked || !this.closeable) {
      return;
    }

    this.close();
    /**
     * @event Item#locked
     */
    this.emit('locked');
    this.locked = true;
  }

  /**
   * Lock this item
   * @fires Item#unlocked
   */
  unlock() {
    if (!this.locked) {
      return;
    }

    /**
     * @event Item#unlocked
     */
    this.emit('unlocked');
    this.locked = false;
  }

  /**
   * Gather data to be persisted
   * @return {Object}
   */
  serialize() {
    let data = {};

    Object.assign(data, {
      entityReference: this.entityReference,
      name: this.name,
      id: this.id,
      uuid: this.uuid,
      keywords: this.keywords,
      roomDesc: this.roomDesc,
      description: this.description,
      inventory: this.inventory && this.inventory.serialize(),
      maxItems: this.maxItems,
      metadata: this.metadata,
      closeable: this.closeable,
      closed: this.closed,
      locked: this.locked,
      lockedBy: this.lockedBy,
      isEquipped: this.isEquipped,
      source: this.source,
      script: this.script
    });

    // serialize behaviors
    let behaviors = {};
    for (const [key, val] of this.behaviors) {
      // serialize each behavior
      behaviors[key] = val;
    }
    data.behaviors = behaviors;

    return data;
  }

  /**
   * Hydrate the item, optionally with data
   * @param {GameState} state
   * @param {Object}    data
   */
  hydrate(state, data = null) {
    // if data is loaded for hydration
    if (data !== null) {
      this.entityReference = data.entityReference;
      this.name = data.name;
      this.id = data.id;
      this.uuid = data.uuid;
      this.description = data.description;
      this.source = data.source;
      this.keywords = data.keywords;
      this.metadata = data.metadata;
      this.roomDesc = data.roomDesc;
      this.closeable = data.closeable;
      this.closed = data.closed;
      this.locked = data.locked;
      this.lockedBy = data.lockedBy;
      this.isEquipped = data.isEquipped;
      this.script = data.script;
      this.source = data.source;
      this.maxItems = data.maxItems;

      // if data has behaviors
      if (Object.entries(data.behaviors).length > 0) {
        this.behaviors = new Map(Object.entries(data.behaviors));
      }

      // if data has an inventory
      if (data.inventory && data.inventory.items.length > 0) {
        this.type = ItemType.CONTAINER;
        this.initializeInventory(data.inventory.items, this.maxItems);
        this.inventory.forEach(item => {
          this.addItem(item);
        });
        this.inventory.hydrate(state, this);
      }
    } else {
      // if there's no data to hydrate, initialize default inventory
      this.defaultItems.forEach(defaultItem => {
        // if the item definition is just an entity reference string in an array
        if (typeof defaultItem === 'string') {
          defaultItem = { id: defaultItem };
        }

        const newItem = state.ItemFactory.create(this.area, defaultItem.id);
        Logger.verbose(`\tDIST: Adding item (${newItem.name}) [${defaultItem.id}] to item (${this.name}) [${this.entityReference}]`);
        newItem.hydrate(state);
        state.ItemManager.add(newItem);
        this.addItem(newItem);
      });
    }

    // if the item has a script
    if (this.script !== '') {
      const scriptPath = `${__dirname + '/'}../bundles/${this.area.bundle}/scripts/item/${this.script}.js`;
      HydrationUtil.hydrateScript(this, scriptPath);
    }

    // if the item has behaviors
    if (this.behaviors.size > 0) {
      for (let [behaviorName, config] of this.behaviors) {
        let behavior = state.ItemBehaviorManager.get(behaviorName);
        if (!behavior) {
          return;
        }

        // behavior may be a boolean in which case it will be `behaviorName: true`
        config = config === true ? {} : config;
        behavior.attach(this, config);
      }
    }
  }
}

module.exports = Item;
