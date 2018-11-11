'use strict';

const Character = require('./Character');
const CommandQueue = require('./CommandQueue');
const Data = require('./Data');
const QuestTracker = require('./QuestTracker');
const Room = require('./Room');
const Logger = require('./Logger');
const PlayerRole = require('./PlayerRole');

/**
 * Representation of a player character
 *
 * @property {Account}      account       Account for this player
 * @property {string}       prompt        Prompt string
 * @property {Map<string,function ()>} extraPrompts Extra prompts to display after primary prompt
 * @property {net.Socket}   socket        Connection socket for player
 * @property {CommandQueue} commandQueue  Queue of commands for player
 * @property {{completed: Array, active: Array}} questData Data object for player's quests
 * @property {QuestTracker} questTracker  QuestTracker for player
 * @property {number}       role          Number representing the player's role rank
 * 
 * @extends Character
 */
class Player extends Character {
  constructor(data) {
    super(data);

    this.account = data.account || null;

    // TODO: abstract Prompt into own class for serialization
    this.prompt = data.prompt || '[ <b><red>%health.current%</b></red>/<b><red>%health.max%</red></b> <b>health</b> ]';
    this.extraPrompts = new Map();

    this.socket = null;
    this.commandQueue = new CommandQueue();

    const questData = Object.assign({
      completed: [],
      active: []
    }, data.quests);
    this.questTracker = new QuestTracker(this, questData.active, questData.completed);

    this.role = data.role || PlayerRole.PLAYER;
  }

  /**
   * Wrapper for `CommandQueue.enqueue()`, queue a command on the player
   * @param {{execute: function(), label: string}} executable Command to run with an execute function and label string
   * @param {number} lag Number of miliseconds of lag to apply to the queue after the command is executed
   * 
   * @see CommandQueue::enqueue
   */
  queueCommand(executable, lag) {
    const index = this.commandQueue.enqueue(executable, lag);

    // emit command queue to self
    this.emit('commandQueued', index);
  }

  /**
   * Proxy all events on the player to the quest tracker
   * @param {string} event
   * @param {...*}   args
   */
  emit(event, ...args) {
    super.emit(event, ...args);

    this.questTracker.emit(event, ...args);
  }

  /**
   * Convert prompt tokens into actual data
   * @param {string} promptStr The prompt string
   * @param {object} extraData Any extra data for the prompt to access
   */
  interpolatePrompt(promptStr, extraData = {}) {
    let attributeData = {};
    for (const [attr, value] of this.attributes) {
      attributeData[attr] = {
        current: this.getAttribute(attr),
        max: this.getMaxAttribute(attr),
        base: this.getAttributeBase(attr),
      };
    }
    const promptData = Object.assign(attributeData, extraData);

    let matches = null;
     /*eslint-disable */
     while (matches = promptStr.match(/%([a-z\.]+)%/)) {
     /*eslint-enable */
      const token = matches[1];
      let promptValue = token.split('.').reduce((obj, index) => obj && obj[index], promptData);
      if (promptValue === null || promptValue === undefined) {
        promptValue = 'invalid-token';
      }
      promptStr = promptStr.replace(matches[0], promptValue);
    }

    return promptStr;
  }

  /**
   * Add a line of text to be displayed immediately after the prompt
   * @param {string}      id       Unique prompt id
   * @param {function()}  renderer Function to call to render the prompt string
   * @param {?boolean}    removeOnRender If true, prompt will remove itself once rendered
   */
  addPrompt(id, renderer, removeOnRender = false) {
    this.extraPrompts.set(id, { removeOnRender, renderer });
  }

  /**
   * Remove a prompt by id
   * @param {string} id Unique prompt id
   */
  removePrompt(id) {
    this.extraPrompts.delete(id);
  }

  /**
   * Whether this player has a prompt with a given id
   * @param {string} id
   * @return {boolean}
   */
  hasPrompt(id) {
    return this.extraPrompts.has(id);
  }

  /**
   * Move this player to the given room, emitting events appropriately
   * @param {Room} nextRoom
   * @param {function} onMoved Function to run after the player is moved to the next room but before enter events are fired
   */
  moveTo(nextRoom, onMoved = _ => _) {
    // check if the player left the area they were in
    let changedArea = false;
    if (this.room.area.name !== nextRoom.area.name) {
      changedArea = true;
    }

    // if the destination room is not the current room
    if (this.room && this.room !== nextRoom) {
      // announce the player's exit from their current room
      this.room.emit('playerLeave', this, nextRoom);

      // emit area departure, if it happened
      if (changedArea) { 
        this.room.area.emit('playerLeave', this, nextRoom);
        this.room.area.removePlayer(this);
      }

      // remove player from their current room
      this.room.removePlayer(this);
    }

    this.room = nextRoom;
    nextRoom.addPlayer(this);

    // execute given function before events
    onMoved();

    // announce the player's entrance to the destination room
    nextRoom.emit('playerEnter', this);

    // emit area arrival, if it happened
    if (changedArea) {
      this.room.area.emit('playerEnter', this);
      nextRoom.area.addPlayer(this);
    }

    // move the player to the destination room
    this.emit('enterRoom', nextRoom);
  }

  /**
   * Save the player to disk
   * @param {function} callback
   */
  save(callback) {
    Data.save('player', this.name, this.serialize(), callback);
  }

  /**
   * Gather data to be persisted
   * @return {Object}
   */
  serialize() {
    let data = Object.assign(super.serialize(), {
      account: this.account.name,
      prompt: this.prompt,
      room: this.room.entityReference,
      quests: this.questTracker.serialize(),
      role: this.role,
    });

    return data;
  }

  /**
   * Hydrate the player, optionally with data
   * @param {GameState} state
   * @param {Object}    data
   */
  hydrate(state, data = null) {
    // QuestTracker must be hydrated first, otherwise events fired by the subsequent
    // hydration will be emitted onto unhydrated quest objects
    this.questTracker.hydrate(state);

    super.hydrate(state, data);
    
    // if data is loaded for hydration
    if (data !== null) {
      this.prompt = data.prompt;
      this.room = data.room;
    }

    // hydrate room
    if (typeof this.room === 'string') {
      let room = state.RoomManager.getRoom(this.room);
      if (!room) {
        Logger.warn(`WARNING: Player ${this.name} was saved to invalid room ${this.room}.`);
        room = state.RoomManager.startingRoom;
      }

      this.room = room;
      this.moveTo(room);
    }

    // hydrate account
    if (typeof this.account === 'string') {
      this.account = state.AccountManager.getAccount(this.account);
    }
  }

  /**
   * Used by Broadcast
   * @see {@link Broadcastable}
   * @see {@link Broadcast}
   */
  getBroadcastTargets() {
    return [this];
  }
}

module.exports = Player;
