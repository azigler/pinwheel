'use strict';

const EventEmitter = require('events');
const AreaFloor = require('./AreaFloor');
const Data = require('./Data');
const Metadatable = require('./Metadatable');

/**
 * Representation of an area
 *
 * @property {string} bundle Bundle containing this area
 * @property {string} name Directory name of area
 * @property {string} title Title of area in metadata
 * @property {Map}    map Map object keyed by the floor z-index, each floor is an array with [x][y] indexes for coordinates.
 * @property {Map<string, Room>} rooms Map of room id to Room
 * @property {Set<Npc>} npcs NPCs that originate from this area
 * @property {Object} config Area configuration
 * @property {Number} lastRespawnTick Milliseconds since last respawn tick. See {@link Area#updateTick}
 * 
 * @implements {Broadcastable}
 * @extends EventEmitter
 * @mixes Metadatable
 * @listens AreaManager#tickAll
 */
class Area extends Metadatable(EventEmitter) {
  constructor(bundle, name, metadata) {
    super();
    this.bundle = bundle;
    this.name = name;

    // Arbitrary data bundles are free to shove whatever they want in
    // WARNING: values must be JSON.stringify-able
    this.metadata = metadata || {};

    this.title = this.metadata.title
    this.npcs = new Set();
    this.players = new Set();
    this.config = Object.assign({
      // default respawn interval (in seconds)
      respawnInterval: 60
    }, this.metadata.config || {});

    this.map = new Map();
    this.rooms = new Map();

    // List of entityReferences of items, NPCs, and quests from
    // this area.
    this.defaultEntities = {
      items: new Set(),
      npcs: new Set(),
      quests: new Set(),
    };

    this.lastRespawnTick = -Infinity;

    // Listens to AreaManager's tickAll(state)
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
  addDefaultItem(entityRef) {
    this.defaultEntities.items.add(entityRef);
  }

  /**
   * Assign an NPC to this area
   * @param {string} entityRef Entity reference of item
   */
  addDefaultNpc(entityRef) {
    this.defaultEntities.npcs.add(entityRef);
  }

  /**
   * Assign a quest to this area
   * @param {string} entityRef Entity reference of item
   */
  addDefaultQuest(entityRef) {
    this.defaultEntities.quests.add(entityRef);
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
   * Remove an NPC from the game and frees its place in its originating room to allow it to respawn
   * @param {Npc} npc
   */
  removeNpc(npc) {
    if (npc.room) {
      npc.room.removeNpc(npc);
    }

    this.npcs.delete(npc);
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
   * 
   * @param {Player} player
   */
  removePlayer(player) {
    this.players.delete(player);
  }

  /**
   * Serialize the area for saving
   */
  serialize() {
    let data = {};

    // save area's metadata
    data = Object.assign(data, {
      metadata: this.metadata
    });

    // serialize rooms
    if (this.rooms instanceof Map) {
      for (let [ id, room ] of this.rooms) {
        // serialize each room
        data[id] = room.serialize();
      }
    }

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
   * Used by Broadcastable
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

    // used in behaviors and scripts
    for(const [id, room] of this.rooms) {
      room.emit('updateTick');
    }

    // used in behaviors and scripts
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
      }
    }
  }
}

module.exports = Area;
