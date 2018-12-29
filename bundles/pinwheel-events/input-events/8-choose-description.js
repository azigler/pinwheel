'use strict';

const sprintf = require('sprintf-js').sprintf;

/**
 * Player character self description event
 */
module.exports = (srcPath) => {
  const EventUtil = require(srcPath + '/Util/EventUtil');

  return {
    event: state => (socket, args) => {
      const say = EventUtil.genSay(socket);

      // check which description the player is choosing
      const remainingDescriptions = args.descGrammar[Object.keys(args.descGrammar)[0]];

      // prompt the player to pick their description
      say(`  <b><white>Choose <cyan>${Object.keys(args.descGrammar)[0]}</cyan><yellow>:</yellow></b>`);
      say('<b><white>---------------------------</white></b>');

      // declare array of menu options
      let options = [];

      // add description options to selection menu
      for (const option of remainingDescriptions) {
        options.push({
          display: option,
          onSelect: option
        });
      }

      // EMPTY MENU LINE
      options.push({ display: "" });

      // display menu of options
      let optionI = 0;
      options.forEach((opt) => {
        if (opt.onSelect) {
          optionI++;
          say(sprintf('  %-30s', `<cyan>[<b>${optionI}</b>]</cyan> ${opt.display}`));
        } else {
          say(sprintf('  %-30s', `<bold><yellow>${opt.display}</yellow></bold>`));
        }
      });
      
      socket.once('data', choice => {
        choice = choice.toString().trim();
        choice = parseInt(choice, 10) - 1;

        // if the input is invalid, show the menu again
        if (isNaN(choice)) {
          return socket.emit('8-choose-description', socket, args);
        }

        // return the selected choice's menu object
        const selection = options.filter(o => !!o.onSelect)[choice];

        if (selection) {
          // if the selection is valid, return it
          choice = selection.onSelect;
        } else {
          // otherwise, prompt for the aspect again
          return socket.emit('8-choose-description', socket, args);
        }

        // add the chosen text to the description table
        args.descriptionTable[Object.keys(args.descGrammar)[0]] = choice;

        // delete the current entry from the grammar
        // TIP: proceeds to the next entry on the next iteration
        delete args.descGrammar[Object.keys(args.descGrammar)[0]];

        // if there are still more descriptions to pick, do so
        if (Object.keys(args.descGrammar).length > 0) {
          say('');
          socket.emit('8-choose-description', socket, args);
        // otherwise, continue to the next step
        } else {
          const species = state.SpeciesManager.getAspect(args.species);
          say('<b><white>Description set</white><yellow>:</yellow></b>');
          say(species.renderDescription(args.descriptionTable));
          say('');
          socket.emit('9-review-character', socket, args);
        }
      });
    }
  };
};
