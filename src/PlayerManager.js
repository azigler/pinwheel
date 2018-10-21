'use strict';

const EventEmitter = require('events');
const Data = require('./Data');
const Player = require('./Player');
const EventManager = require('./EventManager');

/**
 * Keep track of all in-game players and player events
 * 
 * @property {Map}          players     Map of active in-game players
 * @property {EventManager} events      Player events
 * 
 * @implements {Broadcastable}
 * @extends EventEmitter
 * @listens PlayerManager#save
 * @listens PlayerManager#updateTick
 */
class PlayerManager extends EventEmitter {
  constructor() {
    super();
    this.players = new Map();
    this.events = new EventManager();

    // attach listeners
    this.on('save', this.saveAll);
    this.on('updateTick', this.tickAll);
  }

  /**
   * Get player by name
   * @param {string} name
   * @return {Player}
   */
  getPlayer(name) {
    return this.players.get(name.toLowerCase());
  }

  /**
   * Add player to manager
   * @param {Player} player
   */
  addPlayer(player) {
    this.players.set(this.keyify(player), player);
  }

  /**
   * Remove player from manager
   * @param {Player} player
   * @param {boolean} killSocket if true, also force close the player's socket
   */
  removePlayer(player, killSocket) {
    if (killSocket) {
      player.socket.end();
    }

    this.players.delete(this.keyify(player));
  }

  /**
   * Get all players in this manager as an array
   * @return {array}
   */
  getPlayersAsArray() {
    return Array.from(this.players.values());
  }

  /**
   * Wrapper function for `EventManager.add`
   * @param {string}   behaviorName
   * @param {Function} listener
   */
  addListener(event, listener) {
    this.events.add(event, listener);
  }

  /**
   * Return an array of active players who pass the filter function
   * @param {Function} fn Filter function
   * @return {array}
   */
  filter(fn) {
    return this.getPlayersAsArray().filter(fn);
  }

  /**
   * Load a player for an account
   * @param {GameState} state
   * @param {Account}   account
   * @param {string}    name      Character name
   * @param {boolean}   force     If true, force reload from storage
   * @return {Player}
   */
  loadPlayer(state, account, name, force) {
    // if the player has already been loaded and we're not forced to reload
    if (this.players.has(name) && !force) {
      return this.getPlayer(name);
    }

    // otherwise, load player from disk and assign to account
    const data = Data.load('player', name);
    data.name = name;

    // create an unhydrated player
    let player = new Player(data);
    player.account = account;

    // attach default player events
    this.events.attach(player);

    // add player to the manager
    this.addPlayer(player);

    // return the new player
    return player;
  }

  /**
   * Generate a key from this player for this class's Map
   * @param {Player} player
   * @return {string}
   */
  keyify(player) {
    // player name in lowercase
    return player.name.toLowerCase();
  }

  /**
   * Whether the specified player exists on disk
   * @param {string} name
   * @return {boolean}
   */
  exists(name) {
    return Data.exists('player', name);
  }

  /**
   * Save all in-game players
   * @param {?function} playerCallback callback function after save of each player
   * @fires Player#save
   */
  saveAll(playerCallback) {
    for (const [ name, player ] of this.players.entries()) {
      player.emit('save', playerCallback);
    }
  }

  
  /**
   * Apply `updateTick` to all in-game players
   * @fires Player#updateTick
   */
  tickAll() {
    for (const [ name, player ] of this.players.entries()) {
      player.emit('updateTick');
    }
  }

  /**
   * Used by Broadcast
   * @see {@link Broadcastable}
   * @see {@link Broadcast}
   * @return {Array<Character>}
   */
  getBroadcastTargets() {
    return this.players;
  }
}

module.exports = PlayerManager;
