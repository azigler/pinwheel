'use strict';

/**
 * Player character name confirmation event
 */
module.exports = (srcPath) => {
  const EventUtil = require(srcPath + '/Util/EventUtil');
  const Config = require(srcPath + 'Config');
  
  return {
    event: state => (socket, args) => {
      const say = EventUtil.genSay(socket);
      const write  = EventUtil.genWrite(socket);

      write(`<bold><white>Create a character named <cyan>${args.name}</cyan><yellow>?</yellow></bold> [<green>y</green>/<red>n</red>]`);
      socket.once('data', confirmation => {
        say('');
        confirmation = confirmation.toString().trim().toLowerCase();

        if (!/[yn]/.test(confirmation)) {
          say('<b><white>Invalid option<yellow>...</yellow></b>')
          return socket.emit('5-name-check', socket, args);
        }

        if (confirmation === 'n') {
          say(`<b><white>Aborting<yellow>...</yellow></b>`);
          return socket.emit('3-menu', socket, args);
        }

        // define aspects for character creation
        let newArgs = Object.assign(args, {
          aspects: Config.get('aspects', ['species','archetype','trait'])
        });

        socket.emit('6-choose-aspect', socket, newArgs);
      });
    }
  };
};
