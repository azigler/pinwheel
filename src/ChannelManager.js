'use strict';

/**
 * Keep track of active channels
 */
class ChannelManager extends Map {
  /**
   * Add a channel
   * @param {Channel} channel
   */
  add(channel) {
    this.set(channel.name, channel);
    if (channel.aliases) {
      channel.aliases.forEach(alias => this.set(alias, channel));
    }
  }

  /**
   * Remove a channel
   * @param {Channel} channel
   */
  remove(channel) {
    this.delete(channel.name);
  }

  /**
   * Find a channel by query string
   * @param {string} search
   * @return {Channel}
   */
  find(search) {
    for (const [ name, channel ] of this.entries()) {
      if (name.indexOf(search) === 0) {
        return channel;
      }
    }
  }
}

module.exports = ChannelManager;
