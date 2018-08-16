'use strict';

/**
 * Contains registered channels
 */
class ChannelManager extends Map {
  /**
   * @param {Channel} channel
   */
  add(channel) {
    this.set(channel.name, channel);
    if (channel.aliases) {
      channel.aliases.forEach(alias => this.set(alias, channel));
    }
  }

  /**
   * @param {Channel} channel
   */
  remove(channel) {
    this.delete(channel.name);
  }

  /**
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
