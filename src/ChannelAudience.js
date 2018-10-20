'use strict';

/**
 * Base channel audience class
 * 
 * @namespace ChannelAudience
 * @implements {Broadcastable}
 */
class ChannelAudience {
  /**
   * Configure the current state for the audience. Called by {@link Channel#send}
   * @param {object} options
   * @param {GameState} options.state
   * @param {Player} options.sender
   * @param {string} options.message
   */
  configure(options) {
    this.state = options.state;
    this.sender = options.sender;
    this.message = options.message;
  }

  /**
   * Modify the message to be sent
   * @param {string} message
   * @return {string}
   */
  alterMessage(message) {
    return message;
  }

  /**
   * Used by Broadcast
   * @see {@link Broadcastable}
   * @see {@link Broadcast}
   * @return {Array<Character>}
   */
  getBroadcastTargets() {
    return this.state.PlayerManager.getPlayersAsArray();
  }
}

module.exports = ChannelAudience;
