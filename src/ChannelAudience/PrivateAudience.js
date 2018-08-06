'use strict';

const ChannelAudience = require('../ChannelAudience');

/**
 * Audience class representing a specific targeted player.
 * Example: `tell` command.
 * @memberof ChannelAudience
 * @extends ChannelAudience
 */
class PrivateAudience extends ChannelAudience {
  getBroadcastTargets() {
    const targetPlayerName = this.message.split(' ')[0];
    const targetPlayer = this.state.PlayerManager.getPlayer(targetPlayerName);
    if (targetPlayer !== this.sender) {
      if (targetPlayer) {
        return [targetPlayer];
      }
    }
    // return token '_self' if they targeted themselves 
    if ((targetPlayer === this.sender) || (targetPlayerName === 'me') || (targetPlayerName === 'self')) {
      return ['_self'];
    }
    else {
      return [];
    }
  }

  alterMessage(message) {
    // Strips target name from message
    return message.split(' ').slice(1).join(' ');
  }
}

module.exports = PrivateAudience;
