'use strict';

/**
 * Keep track of the queue of commands to execute for a player
 * 
 * @property {Array<Command>} commands    Array of Commands in this queue
 * @property {number}         lag         Amount of lag in miliseconds
 * @property {number}         lastRun     Timestamp of when queue last executed
 */
class CommandQueue {
  constructor() {
    this.commands = [];
    this.lag = 0;
    this.lastRun = 0;
  }

  /**
   * Whether this queue has any commands pending
   * @type {boolean}
   */
  get hasPending() {
    return this.commands.length > 0;
  }

  /**
   * Return array of commands in this queue
   * @type {Array<Command>}
   */
  get queue() {
    return this.commands;
  }

  /**
   * Return number of seconds until the next command will run, rounded to nearest tenth of a second
   * @type {number}
   */
  get lagRemaining() {
    // if there are pending commands, get the time remaining
    return this.commands.length ? this.getTimeTilRun(0) : 0;
  }

  /**
   * Flush all pending commands
   */
  flush() {
    this.commands = [];
    this.lag = 0;
    // WARNING: do not reset lastRun, potential player exploit
  }

  /**
   * @param {{execute: function(), label: string}} executable Command to run with an execute function and label string
   * @param {number} lag Number of miliseconds of lag to apply to the queue after the command is executed
   */
  enqueue(executable, lag) {
    let newIndex = this.commands.push(Object.assign(executable, { lag })) - 1;
    return newIndex;
  }

  /**
   * Execute the currently pending command, if it's ready
   * @return {boolean} Whether the command was executed
   */
  execute() {
    // if there are no commands in the queue or not enough lag time has elapsed
    if (!this.commands.length || Date.now() - this.lastRun < this.lag) {
      return false;
    }

    // remove the first command from the queue
    const command = this.commands.shift();

    // execute the command
    this.lastRun = Date.now();
    this.lag = command.lag;
    command.execute();
    return true;
  }

  /**
   * Return the seconds until the provided index in the queue will execute, rounded to nearest tenth of a second
   * @param {number} commandIndex Index of command in queue (0 is the first command in the queue)
   * @return {number} Rounded to nearest tenth of a second
   */
  getTimeTilRun(commandIndex) {
    // if the index doesn't exist
    if (!this.commands[commandIndex]) {
      throw new RangeError("Invalid command index");
    }

    let lagTotal = 0;
    // count lag for all commands up to provided index
    for (let i = 0; i < this.commands.length; i++) {
      const command = this.commands[i];
      lagTotal += command.lag;
      if (i === commandIndex) {
        // return seconds (converted from miliseconds) until the provided index will execute
        return Math.max(0, this.lastRun + lagTotal - Date.now()) / 1000;
      }
    }
  }
}

module.exports = CommandQueue;
