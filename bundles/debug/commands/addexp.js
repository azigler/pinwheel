'use strict';

// TODO: add target (default self)

/**
 * Add specified amount of experience to self.
 */
module.exports = (srcPath) => {
  const Broadcast = require(srcPath + 'Broadcast');
  const PlayerRoles = require(srcPath + 'PlayerRoles');

  return {
    requiredRole: PlayerRoles.ADMIN,
    command: (state) => (args, player) => {
      args = args.trim();

      if (!args.length) {
        return Broadcast.sayAt(player, '<b>addexp <amount></b>');
      }

      const amount = parseInt(args, 10);
      if (isNaN(amount) || amount <= 0) {
        return Broadcast.sayAt(player, 'Amount must be greater than 0.');
      }

      player.emit('experience', amount);
    }
  };
};
