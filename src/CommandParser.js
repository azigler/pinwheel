'use strict';

const CommandType = require('./CommandType');

/**
 * Utility functions for parsing all input from a player
 */
class CommandParser {
  /**
   * Parse a given string to find the resulting command and arguments
   * @param {GameState} state     Game state
   * @param {string}    data      String of input from the player
   * @param {Player}    player    Player who fired command
   * @return {{
   *   type: CommandType,         Type of command
   *   ?command: Command,         If default command
   *   ?skill: Skill,             If skill command
   *   ?channel: Channel,         If channel command
   *   args: string,              For Command.execute `args` property
   *   originalCommand: string    For Command.execute `arg0` property
   * }}
   */
  static parse(state, data, player) {
    // trim any whitespace from input
    data = data.trim();

    // split input by words
    const parts = data.split(' ');

    // take the first word from the input
    const command = parts.shift().toLowerCase();

    // if no first word, throw error
    if (!command.length) {
      throw new InvalidCommandError();
    }

    // join the remaining words together as an argument string for the command
    const args = parts.join(' ');

    // if the input is just 'l', then return `look`
    if (command === 'l') {
      return {
        type: CommandType.COMMAND,
        command: state.CommandManager.get('look'),
        args: args
      };
    }

    // if the input is just 'i', then return `inventory`
    if (command === 'i') {
      return {
        type: CommandType.COMMAND,
        command: state.CommandManager.get('inventory'),
        args: args
      };
    }

    // define directions and their shortcuts
    const directions = {
      'north':  'north',
      'east':  'east',
      'south':  'south',
      'west':  'west',
      'up':  'up',
      'down':  'down',

      'northeast': 'northeast',
      'southeast': 'southeast',
      'northwest': 'northwest',
      'southwest': 'southwest',

      'n':  'north',
      'e':  'east',
      's':  'south',
      'w':  'west',
      'u':  'up',
      'd':  'down',

      'ne': 'northeast',
      'se': 'southeast',
      'nw': 'northwest',
      'sw': 'southwest',
    };

    // get move command from `pinwheel.json`
    const moveCommand = state.Config.get("moveCommand");

    // if the input is in the list of directions
    if (command in directions) {
      const direction = directions[command];
      return {
        type: CommandType.COMMAND,
        command: state.CommandManager.get(moveCommand),
        args: direction,
        originalCommand: direction
      };
    }

    // if the input is an exit and the player can go that way
    if (player.canGo(command)) {
      return {
        type: CommandType.COMMAND,
        command: state.CommandManager.get(moveCommand),
        args: command,
        originalCommand: command
      };
    }

    // if the input exactly matches a command
    if (state.CommandManager.get(command)) {
      return {
        type: CommandType.COMMAND,
        command: state.CommandManager.get(command),
        args,
        originalCommand: command
      };
    }

    // if the input matches the beginning of a command
    let found = state.CommandManager.find(command, /* returnAlias: */ true);
    if (found) {
      return {
        type: CommandType.COMMAND,
        command: found.command,
        args,
        originalCommand: found.alias
      };
    }

    // if the input is a channel
    found = state.ChannelManager.find(command);
    if (found) {
      return {
        type: CommandType.CHANNEL,
        channel: found,
        args
      };
    }

    // if the input is a skill
    found = state.AbilityManager.find(command);
    if (found) {
      return {
        type: CommandType.SKILL,
        skill: found,
        args
      };
    }

    throw new InvalidCommandError();
  }

  /**
   * Parse dot keyword notation (e.g., "get 2.foo bar")
   * @param {string}   search    Search string
   * @param {Iterable} list      Where to look
   * @param {boolean}  returnKey If `list` is a Map, true to return the KV tuple instead of just the entry
   * @return {*}                 Boolean on error, otherwise an entry from the list
   */
  static parseDot(search, list, returnKey = false) {
    // if there's nowhere to look
    if (!list) {
      return null;
    }

    const parts = search.split('.');
    let findNth = 1;
    let keyword = null;

    // if more than one dot was used
    if (parts.length > 2) {
      return false;
    }

    // if nothing after dot, use the one word
    if (parts.length === 1) {
      keyword = parts[0];
    } else {
      // get number from before dot
      findNth = parseInt(parts[0], 10);
      // set keyword from after dot
      keyword = parts[1];
    }

    // start searching for the entity
    let encountered = 0;
    for (let entity of list) {
      let key, entry;
      if (list instanceof Map) {
        [key, entry] = entity;
      } else {
        entry = entity;
      }

      // validate entity
      if (!('keywords' in entry) && !('name' in entry)) {
        throw new Error('Items in list have no keywords or name');
      }

      // prioritize entity keywords
      if (entry.keywords && (entry.keywords.includes(keyword) || entry.uuid === keyword)) {
        encountered++;
        if (encountered === findNth) {
          return returnKey ? [key, entry] : entry;
        }
        // if the keyword matched, skip to next loop so we don't double-increment `encountered`
        continue;
      }

      // check entity names
      if (entry.name && entry.name.toLowerCase().includes(keyword.toLowerCase())) {
        encountered++;
        if (encountered === findNth) {
          return returnKey ? [key, entry] : entry;
        }
      }
    }

    // found nothing
    return false;
  }
}
exports.CommandParser = CommandParser;

/**
 * Used when the player enters a bad command
 * @extends Error
 */
class InvalidCommandError extends Error {}
/**
 * Used when the player tries a command they don't have access to
 * @extends Error
 */
class RestrictedCommandError extends Error {}
exports.InvalidCommandError = InvalidCommandError;
exports.RestrictedCommandError = RestrictedCommandError;
