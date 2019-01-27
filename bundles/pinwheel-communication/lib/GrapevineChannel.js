'use strict';

const BaseChannel = require('../../../src/Channel');

/**
 * Wrapper around `Channel` for Grapevine network
 * @see {@link Broadcast#atExcept}
 */
class GrapevineChannel extends BaseChannel {
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

    // if the message came from Grapevine, don't report it back
    if (sender.isGrapevine) {
      return;
    }

    // otherwise, send the message along to Grapevine
    state.GrapevineEmitter.emit("channels/send", this.remoteChannel, sender.name, message);
  }
}

module.exports = GrapevineChannel;
