'use strict';

const EventEmitter = require('events');
const RandomUtil = require('./Util/RandomUtil');
const Logger = require('./Logger');
const HydrationUtil = require('./Util/HydrationUtil');
const Metadatable = require('./Metadatable');

/**
 * Representation of a room
 * 
 * @property {Area}          area         Area the room is in
 * @property {string}        title        Title shown on look/scan
 * @property {string}        description  Room description seen on 'look'
 * @property {number}        id           Area-relative id (vnum)
 * @property {string}        entityReference Entity reference for the room
 * @property {Map}           doors        Current state of doors, keys are entity references of exits with doors
 * @property {Object}        defaultDoors Default state of doors, object keys are entity references of exits with doors
 * @property {Array<object>} exits        Exits out of this room, object keys are entity references of destination rooms { direction: string, leaveMessage: string }
 * @property {{x: number, y: number, z: number}} [coordinates] Defined in yml with array [x, y, z].
 * @property {Map}           behaviors    Map of behaviors for area
 * @property {string}        script       Name of custom script attached to this room
 * @property {items: Set, npcs: Set} defaultEntities List of item entity references that spawn in the room
 * @property {Set}           items        Items currently in the room
 * @property {Set}           npcs         Npcs currently in the room
 * @property {Set}           players      Players currently in the room
 * @property {items: Array<string:uuid + entityRef>, npcs: Array<uuid + entityRef>} spawnedEntities Entities spawned by the room
 *
 * @implements {Broadcastable}
 * @extends EventEmitter
 * @mixes Metadatable
 * @listens Area#respawnTick
 */
class Room extends Metadatable(EventEmitter) {
  constructor(area, def) {
    super();

    // validate loaded room
    const required = ['title', 'description', 'id'];
    for (const prop of required) {
      if (!(prop in def)) {
        throw new Error(`ERROR: AREA[${area.name}] Room does not have required property: ${prop}`);
      }
    }

    // assign required properties
    this.area = area;
    this.title = def.title;
    this.description = def.description;
    this.id = def.id;
    // create entity reference
    this.entityReference = this.area.name + ':' + this.id;

    // assign doors from room definition
    this.doors = new Map();
    for (let key in def.doors) {
      this.doors.set(def.doors[key].roomId, def.doors[key]);
    }

    // create by-val copies of the doors config so the lock/unlock don't accidentally modify the original definition
    this.defaultDoors = def.doors;

    this.exits = def.exits || [];
    this.coordinates = Array.isArray(def.coordinates) && def.coordinates.length === 3 ? {
      x: def.coordinates[0],
      y: def.coordinates[1],
      z: def.coordinates[2],
    } : null;

    this.behaviors = new Map(Object.entries(def.behaviors || {}));
    this.script = def.script || '';

    // default entities spawned by room
    this.defaultEntities = {
      items: new Set(def.items || []),
      npcs: new Set(def.npcs || [])
    }

    // current items, NPCs, and players in the room
    this.items = new Set();
    this.npcs = new Set();
    this.players = new Set();

    // arbitrary data storage
    // WARNING: values must be JSON.stringify-able
    this.metadata = def.metadata || {};

    // track entities spawned in this room
    this.spawnedEntities = {
      items: def.spawnedItems || [],
      npcs: def.spawnedNpcs || []
    }

    // listen to Area's updateTick(state) if it triggers a respawn
    this.on('respawnTick', this.respawnTick);
  }

  /**
   * Emit event on self and proxy certain events to other entities in the room.
   * @param {string} eventName
   * @param {...*} args
   * @return {void}
   */
  emit(eventName, ...args) {
    super.emit(eventName, ...args);

    const proxiedEvents = [
      'playerEnter',
      'playerLeave'
    ];

    if (proxiedEvents.includes(eventName)) {
      const entities = [...this.npcs, ...this.players, ...this.items];
      for (const entity of entities) {
        entity.emit(eventName, ...args);
      }
    }
  }

  /**
   * Return true if the area has the specified behavior
   * @param {string} name
   * @return {boolean}
   */
  hasBehavior(name) {
    return this.behaviors.has(name);
  }

  /**
   * Return the specified behavior
   * @param {string} name
   * @return {*}
   */
  getBehavior(name) {
    return this.behaviors.get(name);
  }

  /**
   * Add a player to the room
   * @param {Player} player
   */
  addPlayer(player) {
    this.players.add(player);
    this.area.addPlayer(player);
    player.room = this;
  }

  /**
   * Remove a player from the room
   * @param {Player} player
   */
  removePlayer(player) {
    this.players.delete(player);
    this.area.removePlayer(player);
  }

  /**
   * Add an NPC to the room
   * @param {Npc} npc
   */
  addNpc(npc) {
    this.npcs.add(npc);
    this.area.npcs.add(npc);
    npc.room = this;
  }

  /**
   * Remove an NPC from the room
   * @param {Npc} npc
   */
  removeNpc(npc) {
    this.npcs.delete(npc);
    this.area.npcs.delete(npc);
  }

  /**
   * Add an item to the room
   * @param {Item} item
   */
  addItem(item) {
    this.items.add(item);
    item.belongsTo = this;
    this.area.addItem(item);
  }

  /**
   * Remove an item from the room
   * @param {Item} item
   */
  removeItem(item) {
    this.items.delete(item);
    this.area.removeItem(item);
  }

  /**
   * Return true if this room has a door between `fromRoom` and here
   * TIP: doors are always in the room being blocked
   * @param {Room} fromRoom
   * @return {boolean}
   */
  hasDoor(fromRoom) {
    return this.doors.has(fromRoom.entityReference);
  }

  /**
   * Return the door in this room between `fromRoom` amd here
   * TIP: doors are always in the room being blocked
   * @param {Room} fromRoom
   * @return {{lockedBy: EntityReference, locked: boolean, closed: boolean}}
   */
  getDoor(fromRoom) {
    if (!fromRoom) {
      return null;
    }
    return this.doors.get(fromRoom.entityReference);
  }

  /**
   * Return true if the door in this room between `fromRoom` and here is locked
   * TIP: doors are always in the room being blocked
   * @param {Room} fromRoom
   * @return {boolean}
   */
  isDoorLocked(fromRoom) {
    const door = this.getDoor(fromRoom);
    if (!door) {
      return false;
    }

    return door.locked;
  }

  /**
   * Open the door in this room between `fromRoom` and here
   * TIP: doors are always in the room being blocked
   * @param {Room} fromRoom
   * @fires Room#doorOpened
   */
  openDoor(fromRoom) {
    const door = this.getDoor(fromRoom);
    if (!door) {
      return;
    }

    /**
     * @event Room#doorOpened
     * @param {Room} fromRoom
     * @param {object} door
     */
    this.emit('doorOpened', fromRoom, door);
    door.closed = false;
  }

  /**
   * Close the door in this room between `fromRoom` and here
   * TIP: doors are always in the room being blocked
   * @param {Room} fromRoom
   * @throws DoorLockedError
   * @fires Room#doorClosed
   */
  closeDoor(fromRoom) {
    const door = this.getDoor(fromRoom);
    if (!door) {
      return;
    }

    /**
     * @event Room#doorClosed
     * @param {Room} fromRoom
     * @param {object} door
     */
    this.emit('doorClosed', fromRoom, door);
    door.closed = true;
  }

  /**
   * Unlock the door in this room between `fromRoom` and here
   * TIP: doors are always in the room being blocked
   * @param {Room} fromRoom
   * @fires Room#doorUnlocked
   */
  unlockDoor(fromRoom) {
    const door = this.getDoor(fromRoom);
    if (!door) {
      return;
    }

    /**
     * @event Room#doorUnlocked
     * @param {Room} fromRoom
     * @param {object} door
     */
    this.emit('doorUnlocked', fromRoom, door);
    door.locked = false;
  }

  /**
   * Lock the door in this room between `fromRoom` and here
   * TIP: doors are always in the room being blocked
   * @param {Room} fromRoom
   * @fires Room#doorUnlocked
   */
  lockDoor(fromRoom) {
    const door = this.getDoor(fromRoom);
    if (!door) {
      return;
    }

    this.closeDoor(fromRoom);
    /**
     * @event Room#doorUnlocked
     * @param {Room} fromRoom
     * @param {object} door
     */
    this.emit('doorLocked', fromRoom, door);
    door.locked = true;
  }

  /**
   * Reset all doors in this room
   */
  resetDoors() {
    this.doors = new Map(Object.entries(JSON.parse(JSON.stringify(this.defaultDoors || {}))));
  }

  /**
   * Check to respawn NPCs and items
   * @param {GameState} state
   */
  respawnTick(state) {    
    // check to respawn NPCs
    this.defaultEntities.npcs.forEach(defaultNpc => {
      // if the NPC definition is just an entity reference String in an Array
      if (typeof defaultNpc === 'string') {
        defaultNpc = { id: defaultNpc };
      }

      // assign default properties
      defaultNpc = Object.assign({
        respawnChance: 100,
        maxLoad: 1
      }, defaultNpc);

      // check how many spawns of this NPCs are currently actively spawned from this room
      const npcCount = this.spawnedEntities.npcs.filter(npc => npc.substring(36) === defaultNpc.id).length;
      const needsRespawn = npcCount < defaultNpc.maxLoad;

      // if a respawn of this NPC isn't needed, skip it
      if (!needsRespawn) {
        return;
      }

      // if the NPC's spawning random chance succeeds, spawn the entity
      if (RandomUtil.probability(defaultNpc.respawnChance)) {
        this.spawnNpc(state, defaultNpc.id);
      }
    });

    // check to respawn items
    this.defaultEntities.items.forEach(defaultItem => {
      // if the item definition is just an entity reference string in an array
      if (typeof defaultItem === 'string') {
        defaultItem = { id: defaultItem };
      }

      // assign default properties
      defaultItem = Object.assign({
        respawnChance: 100,
        maxLoad: 1,
      }, defaultItem);

      // check how many spawns of this item are currently actively spawned from this room
      const itemCount = this.spawnedEntities.items.filter(item => item.substring(36) === defaultItem.id).length;
      const needsRespawn = itemCount < defaultItem.maxLoad;

      // if a respawn of this item isn't needed, skip it
      if (!needsRespawn) {
        return;
      }

      // if the item's spawning random chance succeeds, spawn the entity
      if (RandomUtil.probability(defaultItem.respawnChance)) {
        this.spawnItem(state, defaultItem.id);
      }
    });
  }

  /**
   * Spawn and hydrate an item in this room
   * @param {GameState} state
   * @param {string} entityRef
   */
  spawnItem(state, entityRef, data = null) {
    const newItem = state.ItemFactory.create(this.area, entityRef);
    newItem.hydrate(state, data);

    state.ItemManager.add(newItem);
    this.addItem(newItem);

    Logger.verbose(`\tSPAWN: Adding item (${newItem.name}) [${entityRef}] to room (${newItem.belongsTo.title}) [${newItem.belongsTo.entityReference}]`);

    // if there is no data, then this entity is treated as new
    if (data === null) {
      const key = newItem.uuid + entityRef;
      this.spawnedEntities.items.push(key);
      newItem.source = {area: this.area.name, room: this.id};
      /**
       * @event Item#spawn
       */
      newItem.emit('spawn');
    }
  }

  /**
   * Spawn and hydrate an NPC in this room
   * @param {GameState} state
   * @param {string} entityRef
   * @fires Npc#spawn
   */
  spawnNpc(state, entityRef, data = null) {
    const newNpc = state.NpcFactory.create(this.area, entityRef);
    newNpc.hydrate(state, data);

    state.NpcManager.add(newNpc);
    this.addNpc(newNpc);

    Logger.verbose(`\tSPAWN: Adding NPC (${newNpc.name}) [${entityRef}] to room (${newNpc.room.title}) [${newNpc.room.entityReference}]`);

    // if there is no data, then this entity is treated as new
    if (data === null) {
      const key = newNpc.uuid + entityRef;
      this.spawnedEntities.npcs.push(key);
      newNpc.source = {area: this.area.name, room: this.id};
      /**
       * @event Npc#spawn
       */
      newNpc.emit('spawn');
    }
  }

  /**
   * Remove a spawned NPC from this room's spawn list
   * @param {Npc} npc
   */
  removeSpawnedNpc(npc) {
    this.spawnedEntities.npcs = this.spawnedEntities.npcs.filter(x => npc.uuid + npc.entityReference !== x);
  }

  /**
   * Remove a spawned item from this room's spawn list
   * @param {Item} item
   */
  removeSpawnedItem(item) {
    this.spawnedEntities.items = this.spawnedEntities.items.filter(x => item.uuid + item.entityReference !== x);
  }

  /**
   * Gather data to be persisted
   * @return {Object}
   */
  serialize() {
    let data = {};

    // save main properties
    Object.assign(data, {
      title: this.title,
      description: this.description,
      coordinates: this.coordinates,
      script: this.script,
      metadata: this.metadata,
      spawnedEntities: {
        items: this.spawnedEntities.items,
        npcs: this.spawnedEntities.npcs
      }
    });

    // serialize doors
    if (this.doors instanceof Map) {
      let doors = [];
      for (let [key, val] of this.doors) {
        // serialize each door
        doors.push(val);
      }
      data.doors = doors;
    } else {
      data.doors = {};
    }

    // serialize exits
    if (this.exits instanceof Array) {
      let exits = [];
      for (let exit of this.exits) {
        // serialize each exit
        exits.push(exit);
      }
      data.exits = exits;
    } else {
      data.exits = {};
    }

    // serialize NPCs
    if (this.npcs instanceof Set) {
      let npcs = {};
      for (let npc of this.npcs) {
        // serialize each NPC
        npcs[npc.uuid] = npc.serialize();
      }
      data.npcs = npcs;
    } else {
      data.npcs = null;
    }

    // serialize items
    if (this.items instanceof Set) {
      let items = {};
      for (let item of this.items) {
        // serialize each item
        items[item.uuid] = item.serialize();
      }
      data.items = items;
    } else {
      data.items = null;
    }

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
   * Hydrate the room, optionally with data
   * @param {GameState} state
   * @param {Object}    data
   */
  hydrate(state, data = null) {
    // if data is loaded for hydration
    if (data !== null) {
      this.title = data.title;
      this.description = data.description;
      this.coordinates = data.coordinates;
      this.script = data.script;
      this.metadata = data.metadata;
      this.exits = data.exits;
      this.spawnedEntities = data.spawnedEntities;

      // if data has behaviors
      if (Object.entries(data.behaviors).length > 0) {
        this.behaviors = new Map(Object.entries(data.behaviors));
      }

      // iterate over NPCs and hydrate from data
      for (let npc in data.npcs) {
        this.spawnNpc(state, data.npcs[npc].entityReference, data.npcs[npc]);
      }

      // iterate over items and hydrate from data
      for (let item in data.items) {
        this.spawnItem(state, data.items[item].entityReference, data.items[item]);
      }

      // copy doors from data
      for (let key in data.doors) {
        this.doors.set(data.doors[key].roomId, data.doors[key]);
      }
    }

    // if the room has a script
    if (this.script !== '') {
      const scriptPath = `${__dirname + '/'}../bundles/${this.area.bundle}/scripts/room/${this.script}.js`;
      HydrationUtil.hydrateScript(this, scriptPath);
    }

    // if the room has behaviors
    if (this.behaviors.size > 0) {
      for (let [behaviorName, config] of this.behaviors) {
        let behavior = state.RoomBehaviorManager.get(behaviorName);
        if (!behavior) {
          return;
        }

        // behavior may be a boolean in which case it will be `behaviorName: true`
        config = config === true ? {} : config;
        behavior.attach(this, config);
      }
    }
  }

  /**
   * Used by Broadcast
   * @see {@link Broadcastable}
   * @see {@link Broadcast}
   * @return {Array<Character>}
   */
  getBroadcastTargets() {
    return Array.from(this.players.values());
  }
}

module.exports = Room;