'use strict';

const ChannelAudience = require('../ChannelAudience');

/**
 * Audience class representing all people with at least the specified role.
 * @memberof ChannelAudience
 * @extends ChannelAudience
 */
class RoleAudience extends ChannelAudience {
  constructor(options) {
    super(options);
    if (!options.hasOwnProperty('minRole')) {
      throw new Error('No role given for role audience');
    }
    this.minRole = options.minRole;
  }

  getBroadcastTargets() {
    return this.state.PlayerManager.filter(player => player.role >= this.minRole && player !== this.sender);
  }
}

module.exports = RoleAudience;
