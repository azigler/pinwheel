'use strict';

/**
 * Save the player and disconnect them from the game
 */
module.exports = (srcPath) => {
  const Broadcast = require(srcPath + 'Broadcast');

  return {
    usage: 'quit',
    command: (state) => (args, player) => {
      // stop this command if the character is in combat
      if (player.isInCombat()) {
        return Broadcast.sayAt(player, "<b><white>You're too busy fighting for your life</white><yellow>!</yellow></b>");
      }

      // call the save command
      state.CommandManager.get('save').execute(null, player);

      // say goodbye
      Broadcast.sayAt(player, "<b><white>Goodbye</white><yellow>!</yellow></b>");

      // handle quit
      player.emit('quit');
      player.socket.emit('close');

      // announce player character logout to server
      const loginReporter = {
        name: 'MUD',
        // implement Broadcastable interface
        getBroadcastTargets() {
          return [];
        }
      }
      const loginMessage = `${player.name} has logged out.`;
      state.ChannelManager.get('chat').send(state, loginReporter, loginMessage);
    }
  };
};
