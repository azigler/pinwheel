'use strict';

/**
 * Player character gender confirmation event
 */
module.exports = (srcPath) => {
  const EventUtil = require(srcPath + '/Util/EventUtil');
  
  return {
    event: state => (socket, args) => {
      const say = EventUtil.genSay(socket);
      const write  = EventUtil.genWrite(socket);

      write(`<bold><white>Is this character <cyan>male</cyan> or <magenta>female</magenta><yellow>?</yellow></bold> [<cyan>m</cyan>/<magenta>f</magenta>]`);
      socket.once('data', confirmation => {
        say('');
        confirmation = confirmation.toString().trim().toLowerCase();
        args.descriptionTable = {};

        if (!/[mf]/.test(confirmation)) {
          say('<b><white>Invalid option<yellow>...</yellow></b>')
          say('');
          return socket.emit('7-confirm-gender', socket, args);
        }

        if (confirmation === 'm') {
          say(`<b><white>Okay<yellow>,</yellow> this character is <cyan>male</cyan><yellow>.</yellow></b>`);
          args.descriptionTable.gender = 'm';
        }

        if (confirmation === 'f') {
          say(`<b><white>Okay<yellow>,</yellow> this character is <magenta>female</magenta><yellow>.</yellow></b>`);
          args.descriptionTable.gender = 'f';
        }

        say('');

        // prepare for description
        const species = state.SpeciesManager.getAspect(args.species);
        args.descGrammar = Object.assign({}, species.descriptionGrammar);

        socket.emit('8-choose-description', socket, args);
      });
    }
  };
};
