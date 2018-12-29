'use strict';

/**
 * Player character creation event
 */
module.exports = (srcPath) => {
  const EventUtil = require(srcPath + '/Util/EventUtil');
  const ValidationUtil = require(srcPath + 'Util/ValidationUtil');

  return {
    event : (state) => (socket, args) => {
      const say = EventUtil.genSay(socket);
      const write  = EventUtil.genWrite(socket);

      write("<bold><white>What would you like to name your character<yellow>?</yellow></bold> ");

      socket.once('data', name => {
        say('');
        name = name.toString().trim();

        const invalid = ValidationUtil.validateName(name);

        if (invalid) {
          say(invalid);
          return socket.emit('4-create-character', socket, args);
        }

        name = name[0].toUpperCase() + name.slice(1);

        const exists = state.PlayerManager.exists(name);

        if (exists) {
          say(`<b><yellow>That name is already taken.</yellow></b>`);
          return socket.emit('4-create-character', socket, args);
        }

        args.name = name;
        return socket.emit('5-confirm-name', socket, args);
      });
    }
  };
};
