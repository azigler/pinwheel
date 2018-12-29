'use strict';

const chalk = require('chalk');

/**
 * Player command event loop
 */
module.exports = (src) => {
  const CommandParser = require(src + 'CommandParser');
  const CommandParserErrors = require(src + '/Error/CommandParserErrors');
  const PlayerRole = require(src + 'PlayerRole');
  const CommandTypes = require(src + 'CommandType');
  const Broadcast = require(src + 'Broadcast');
  const Logger = require(src + 'Logger');

  return {
    event: state => player => {
      // wait for player input
      player.socket.once('data', data => {
        // helper function for re-entering the loop
        function loop () {
          player.socket.emit('loop', player);
        }

        // get player input
        data = data.toString().trim();

        // if no input, loop again
        if (!data.length) {
          return loop();
        }

        // otherwise, set now as the most recent input time
        player._lastCommandTime = Date.now();

        // attempt to execute the input
        try {
          // determine input type
          const result = CommandParser.parse(state, data, player);
          // if the input type couldn't be determined, return null
          if (!result) {
            throw null;
          }
          // otherwise, execute the input based on its type
          switch (result.type) {
            // if the input is a command
            case CommandTypes.COMMAND: {
              // determine if player meets the command's role requirement
              const { requiredRole = PlayerRole.PLAYER } = result.command;
              if (requiredRole > player.role) {
                throw new CommandParserErrors.RestrictedCommandError();
              }
              // commands have no lag and are immediately executed
              result.command.execute(result.args, player, result.originalCommand);
              break;
            }
            // if the input is a channel
            case CommandTypes.CHANNEL: {
              if (result.channel.minRequiredRole !== null && result.channel.minRequiredRole > player.role) {
                throw new CommandParserErrors.RestrictedCommandError();
              }
              // channel input has no lag and is immediately sent
              result.channel.send(state, player, result.args);
              break;
            }
            // if the input is a skill
            case CommandTypes.SKILL: {
              // verify the player has the skill
              if (player.hasAttribute(result.skill.id)) {
                // queue the skill for execution
                player.queueCommand({
                  execute: _ => {
                    player.emit('useSkill', result.skill, result.args);
                  },
                  label: data,
                }, result.skill.lag || state.Config.get('skillLag') || 1000);
              } else {
                Broadcast.sayAt(player, 'Huh?');
              }
              break;
            }
          }
        // if the input returns an error
        } catch (error) {
          switch(true) {
            // if the error was due to an invalid command
            case error instanceof CommandParserErrors.InvalidCommandError:
              // check if the player's room has a matching context-specific command
              const roomCommands = player.room.getBehavior('commands');
              const [commandName, ...args] = data.split(' ');
              // if the room has the input as a command
              if (roomCommands && roomCommands.includes(commandName)) {
                // proxy the input to the room via an event
                player.room.emit('command', player, commandName, args.join(' '));
              } else {
                Broadcast.sayAt(player, "Huh?");
                Logger.warn((`${chalk.bold.yellow(player.name)} tried non-existent command: '${chalk.bold.white(data)}'`));
              }
              break;
            // if the error was due to a restricted command
            case error instanceof CommandParserErrors.RestrictedCommandError:
              Broadcast.sayAt(player, "Huh?");
              Logger.warn((`${chalk.bold.yellow(player.name)} tried restricted command: '${chalk.bold.white(data)}'`));
              break;
            // otherwise, just log the error
            default:
              Logger.error(error);
          }
        }

        // TODO: fix to prevent duplicate prompt during combat abilities
        Broadcast.prompt(player);

        // loop again
        loop();
      });
    }
  };
};
