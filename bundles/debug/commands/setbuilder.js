'use strict';

/**
 * Set a player as a builder.
 */
module.exports = (srcPath) => {
  const Broadcast = require(srcPath + 'Broadcast');
  const PlayerRoles = require(srcPath + 'PlayerRoles');
  const { CommandParser: Parser } = require(srcPath + 'CommandParser');

  return {
    requiredRole: PlayerRoles.ADMIN,
    command: (state) => (args, player) => {
      args = args.trim();

      if (!args.length) {
        return Broadcast.sayAt(player, '<b>setbuilder <player></b>');
      }

      const target = Parser.parseDot(args, player.room.players);

      if (!target) {
        return Broadcast.sayAt(player, 'They are not here.');
      }

      if (target.role === PlayerRoles.BUILDER) {
        return Broadcast.sayAt(player, 'They are already a builder.');
      }

      if (target.role > PlayerRoles.BUILDER) {
        return Broadcast.sayAt(player, 'They are already higher ranking than a builder.');
      }

      target.role = PlayerRoles.BUILDER;
      Broadcast.sayAt(target, `You have been made a builder by ${player.name}.`);
      Broadcast.sayAt(player, `${target.name} is now a builder.`);
    }
  };
};
