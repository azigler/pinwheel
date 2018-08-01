'use strict';

// TODO: make restart/hot reboot command

/**
 * Shut down the MUD from within the game.
 */
module.exports = srcPath => {
  const Broadcast = require(srcPath + 'Broadcast');
  const PlayerRoles = require(srcPath + 'PlayerRoles');

  return {
    requiredRole: PlayerRoles.ADMIN,
    command: state => (time, player) => {
      if (time === 'now') {
        Broadcast.sayAt(state.PlayerManager, '<b><yellow>The server is shutting down now!</yellow></b>');
        state.PlayerManager.saveAll();
        process.exit();
        return;
      }

      if (!time.length || time !== 'sure') {
        return Broadcast.sayAt(player, 'You must confirm the shutdown with <b>shutdown sure</b> or force immediate shutdown with <b>shutdown now</b>.');
      }

      Broadcast.sayAt(state.PlayerManager, `<b><yellow>The server will shut down in ${30} seconds.</yellow></b>`);
      setTimeout(_ => {
        Broadcast.sayAt(state.PlayerManager, '<b><yellow>The server is shutting down now!</yellow></b>');
        state.PlayerManager.saveAll();
        process.exit();
      }, 30000);

      // TODO: duplicate and modify into restart command
    }
  };
};
