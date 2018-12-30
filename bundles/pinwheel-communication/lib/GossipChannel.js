'use strict';

const BaseChannel = require('../../../src/Channel');

/**
 * Wrapper around `Channel` for Gossip network
 * @see {@link Broadcast#atExcept}
 */
class GossipChannel extends BaseChannel {
  constructor(config) {
    super(config);

    this.remoteChannel = config.remoteChannel;
  }

  /**
   * Wrapper function for sending a message from a player
   * @param {GameState} state
   * @param {Player}    sender
   * @param {string}    message
   */
  send(state, sender, message) {
    // send the message over the internal channel
    super.send(state, sender, message);

    // if the message came from Gossip, don't report it back
    if (sender.isGossip) {
      return;
    }

    // otherwise, send the message along to Gossip
    state.GossipEmitter.emit("channels/send", this.remoteChannel, sender.name, message);
  }
}

module.exports = GossipChannel;
