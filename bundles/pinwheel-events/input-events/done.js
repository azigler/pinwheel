'use strict';

const chalk = require('chalk');

/**
 * Player character gameplay preparation event
 */
module.exports = (srcPath) => {
  const Broadcast = require(srcPath + 'Broadcast');
  const Data = require(srcPath + 'Data');
  const Logger = require(srcPath + 'Logger');

  return {
    event: state => (socket, args) => {
      // load the player character
      let player = args.player;
      const data = Data.load('player', player.name);
      player.hydrate(state, data);
      player.save();

      // prepare player character for commands
      player._lastCommandTime = Date.now();

      // prepare player socket for when the connection closes
      player.socket.on('close', () => {
        // TODO: fix double-log bug
        Logger.warn((`${chalk.bold.yellow(player.name)} has gone linkdead.`));
        player.save(() => {
          player.room.removePlayer(player);
          state.PlayerManager.removePlayer(player, true);
        });
      });

      // force the player to look
      state.CommandManager.get('look').execute(null, player);
      Broadcast.prompt(player);

      // announce player character login to server
      const loginReporter = {
        name: 'MUD',
        // implements Broadcastable interface
        getBroadcastTargets() {
          return [];
        }
      }
      const loginMessage = `${player.name} has logged in.`;
      state.ChannelManager.get('chat').send(state, loginReporter, loginMessage);

      // place the player in a command loop
      // TIP: this is where the player will spend the rest of their session playing
      player.socket.emit('loop', player);

      // TIP: currently only used for pinwheel-streams
      player.emit('login');
    }
  };
};
