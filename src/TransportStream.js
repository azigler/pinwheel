'use strict';

const EventEmitter = require('events');

/**
 * Base class for a stream that exchanges data with the player
 */
class TransportStream extends EventEmitter {
  /**
   * Getter for readable property
   * @type {boolean}
   */
  get readable() {
    return true;
  }

  /**
   * Getter for writable property
   * @type {boolean}
   */
  get writable() {
    return true;
  }

  /**
   * Attach a socket to this stream
   * @param {*} socket
   */
  attach(socket) {
    this.socket = socket;

    this.socket.on('close', _ => {
      this.emit('close');
    });
  }

  /**
   * A subtype-safe way to execute commands on a specific type of stream that invalid types will ignore. For given input
   * TIP: <command:`someCommand`> will look for a method called `executeSomeCommand` on the `TransportStream`
   * @param {string} command
   * @param {...*}  args
   * @return {*}
   */
  command(command, ...args) {
    if (!command || !command.length) {
      throw new RangeError("Must specify a command to the stream");
    }
    command = 'execute' + command[0].toUpperCase() + command.substr(1);
    if (typeof this[command] === 'function') {
      return this[command](...args);
    }
  }

  address() {
    return null;
  }

  end() {
    /* noop */
  }

  setEncoding() {
    /* noop */
  }

  pause() {
    /* noop */
  }

  resume() {
    /* noop */
  }

  destroy() {
    /* noop */
  }

  write() {
    /* noop */
  }
}

module.exports = TransportStream;
