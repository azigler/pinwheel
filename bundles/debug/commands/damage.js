'use strict';

// TODO: accept target (default self)
// TODO: accept attribute (default health)

/**
 * Deal specified amount of damage to self.
 */
module.exports = (srcPath) => {
  const Broadcast = require(srcPath + 'Broadcast');
  const PlayerRoles = require(srcPath + 'PlayerRoles');

  return {
    requiredRole: PlayerRoles.ADMIN,
    command: (state) => (args, player) => {
      args = args.trim();

      if (!args.length) {
        return Broadcast.sayAt(player, '<b>damage <amount></b>');
      }

      const amount = parseInt(args, 10);
      if (isNaN(amount) || amount <= 0) {
        return Broadcast.sayAt(player, 'Amount must be greater than 0.');
      }

      player.lowerAttribute('health', amount);
    }
  };
};
