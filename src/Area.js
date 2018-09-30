'use strict';

const EventEmitter = require('events');
const AreaFloor = require('./AreaFloor');
const Data = require('./Data');
const Metadatable = require('./Metadatable');
const HydrationUtil = require('./Util/HydrationUtil');

/**
 * Representation of an area
 *
 * @property {string}     bundle    Bundle containing area
 * @property {string}     name      Directory name of area
 * @property {string}     title     Title of area in metadata
 * @property {Object}     config    Area configuration
 * @property {Set<Npc>}   npcs      Set of NPCs currently in area
 * @property {Set<Player>} players  Set of players currently in area
 * @property {Set<Item>}  items     Set of items currently in area
 * @property {Map}        map       Map object keyed by the floor z-index, each floor is an array with [x][y] indexes for coordinates.
 * @property {Map<string, Room>} rooms Map of room id to Room
 * @property {string}     script    Script filename for area
 * @property {Map}        behaviors Map of behaviors for area
 * @property {Object}     loadedEntities Object of Sets of entities loaded from this area's data
 * @property {Number}     lastRespawnTick Milliseconds since last respawn tick. See {@link Area#updateTick}
 * 
 * @implements {Broadcastable}
 * @extends EventEmitter
 * @mixes Metadatable
 * @listens AreaManager#tickAll
 */
class Area extends Metadatable(EventEmitter) {
  constructor(bundle, name, manifest) {
    super();
    this.bundle = bundle;
    this.name = name;
    this.title = manifest.title;

    this.config = Object.assign({
      // default respawn interval (in seconds)
      respawnInterval: 60
    }, manifest.config || {});

    this.npcs = new Set();
    this.players = new Set();
    this.items = new Set();

    this.map = new Map();
    this.rooms = new Map();

    this.script = manifest.script || '';
    this.behaviors = new Map(Object.entries(manifest.behaviors || {}));

    // list of entityReferences of items, NPCs, and quests from this area.
    this.loadedEntities = {
      items: new Set(),
      npcs: new Set(),
      quests: new Set(),
    };

    this.lastRespawnTick = -Infinity;

    // arbitrary data storage
    // WARNING: values must be JSON.stringify-able
    this.metadata = manifest.metadata || {};

    // listen to AreaManager's tickAll(state)
    this.on('updateTick', state => {
      this.updateTick(state);
    });
  }

  /**
   * Get Pinwheel-root-relative path to this area
   * @return {string}
   */
  get areaPath() {
    return `${this.bundle}/areas/${this.name}`;
  }

  /**
   * Get an ordered list of floors in this area's map
   * @return {Array<number>}
   */
  get floors() {
    return [...this.map.keys()].sort();
  }

  /**
   * Get room by id
   * @param {string} id Room id
   * @return {Room|undefined}
   */
  getRoomById(id) {
    return this.rooms.get(id);
  }

  /**
   * Assign an item to this area
   * @param {string} entityRef Entity reference of item
   */
  loadItem(entityRef) {
    this.loadedEntities.items.add(entityRef);
  }

  /**
   * Assign an NPC to this area
   * @param {string} entityRef Entity reference of NPC
   */
  loadNpc(entityRef) {
    this.loadedEntities.npcs.add(entityRef);
  }

  /**
   * Assign a quest to this area
   * @param {string} entityRef Entity reference of quest
   */
  loadQuest(entityRef) {
    this.loadedEntities.quests.add(entityRef);
  }

  /**
   * Add a room to the area
   * @param {Room} room
   */
  addRoom(room) {
    this.rooms.set(room.id, room);

    if (room.coordinates) {
      this.addRoomToMap(room);
    }
  }

  /**
   * Remove a room from the area
   * @param {Room} room
   */
  removeRoom(room) {
    this.rooms.delete(room.id);
  }

  /**
   * Add a room to the map grid
   * @param {Room} room
   * @throws Error
   */
  addRoomToMap(room) {
    if (!room.coordinates) {
      throw new Error('Room does not have coordinates');
    }

    const {x, y, z} = room.coordinates;

    if (!this.map.has(z)) {
      this.map.set(z, new AreaFloor(z));
    }

    const floor = this.map.get(z);
    floor.addRoom(x, y, room);
  }

  /**
   * Find a room at the given coordinates for the area
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @return {Room|boolean}
   */
  getRoomAtCoordinates(x, y, z) {
    const floor = this.map.get(z);
    return floor && floor.getRoom(x, y);
  }

  /**
   * Add an NPC to the area
   * @param {Npc} npc
   */
  addNpc(npc) {
    this.npcs.add(npc);
  }

  /**
   * Remove an NPC from the area
   * @param {Npc} npc
   */
  removeNpc(npc) {
    this.npcs.delete(npc);
  }

  /**
   * Add an item to the area
   * @param {Item} item
   */
  addItem(item) {
    this.items.add(item);
  }

  /**
   * Remove an item from the area
   * @param {Item} item
   */
  removeItem(item) {
    this.items.delete(item);
  }

  /**
   * Add a player to the area
   * @param {Player} player
   */
  addPlayer(player) {
    this.players.add(player);
  }

  /**
   * Remove a player from the area
   * @param {Player} player
   */
  removePlayer(player) {
    this.players.delete(player);
  }

  /**
   * Emit event on self and proxies certain events to other entities in the area.
   * @param {string} eventName
   * @param {...*} args
   * @return {void}
   */
  emit(eventName, ...args) {
    super.emit(eventName, ...args);

    // TODO: expand the list of proxied events
    const proxiedEvents = [
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
   * Serialize the area for saving
   */
  serialize() {
    let data = {};

    // save area's metadata
    data = Object.assign(data, {
      title: this.title,
      script: this.script,
      metadata: this.metadata
    });

    // serialize rooms
    if (this.rooms instanceof Map) {
      for (let [ id, room ] of this.rooms) {
        // serialize each room
        data[id] = room.serialize();
      }
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
   * Save the area to disk
   * @param {function} callback
   */
  save(callback) {
    Data.save('area', this.name, this.serialize(), callback);
  }

  /**
   * Hydrate the area, optionally with data
   * @param {GameState} state
   * @param {Object} data
   */
  hydrate(state, data = undefined) {
    // if data is loaded for hydration
    if (data !== undefined) {
      this.title = data.title;
      this.metadata = data.metadata;
      this.script = data.script;

      // if data has behaviors
      if (Object.entries(data.behaviors).length > 0) {
        this.behaviors = new Map(Object.entries(data.behaviors));
      }
    }

    // if the area has a script
    if (this.script !== '') {
      const scriptPath = `${__dirname + '/'}../bundles/${this.bundle}/scripts/area/${this.script}.js`;
      HydrationUtil.hydrateScript(this, scriptPath);
    }

    // if the area has behaviors
    if (this.behaviors.size > 0) {
      for (let [behaviorName, config] of this.behaviors) {
        let behavior = state.AreaBehaviorManager.get(behaviorName);
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

  /**
   * Automatically called every N milliseconds, where N is defined in the
   * `setInterval` call to `GameState.AreaManager.tickAll` in the `pinwheel` executable.
   * It, in turn, will fire the `updateTick` event on all its rooms.
   *
   * Also handles firing the `respawnTick` event on rooms to trigger respawn.
   * @see {@link Room.respawnTick}
   * 
   * @param {GameState} state
   */
  updateTick(state) {
    // TIP: used in behaviors and scripts
    for(const [id, room] of this.rooms) {
      room.emit('updateTick');
    }

    // TIP: used in behaviors and scripts
    for (const npc of this.npcs) {
      npc.emit('updateTick');
    }

    // handle respawn
    const sinceLastTick = Date.now() - this.lastRespawnTick;
    if (sinceLastTick >= this.config.respawnInterval * 1000) {
      this.lastRespawnTick = Date.now();
      for (const [id, room] of this.rooms) {
        // spawns everything at the beginning and every interval
        room.emit('respawnTick', state);
        // save area to disk
        this.save();
      }
    }
  }
}

module.exports = Area;
