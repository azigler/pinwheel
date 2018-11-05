'use strict';

const EventEmitter = require('events');

class GameServer extends EventEmitter {
  /**
   * Start the server
   * @param {commander} commander
   * @fires GameServer#startup
   */
  startup(commander) {
    /**
     * @event GameServer#startup
     * @param {commander} commander
     */
    this.emit('startup', commander);
  }

  /**
   * Shut down the server
   * @fires GameServer#shutdown
   */
  shutdown() {
    /**
     * @event GameServer#shutdown
     */
    this.emit('shutdown');
  }
}

module.exports = GameServer;
