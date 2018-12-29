'use strict';

const sprintf = require('sprintf-js').sprintf;

/**
 * Player character aspect selection event
 */
module.exports = (srcPath) => {
  const EventUtil = require(srcPath + '/Util/EventUtil');
  const Config = require(srcPath + 'Config');

  return {
    event: state => (socket, args) => {
      const say = EventUtil.genSay(socket);

      // check which aspect the player is choosing
      const currentAspect = args.aspects.shift();

      // pull a list of the current aspect's options
      let aspect;
      switch (currentAspect) {
        case 'species': aspect = [...state.SpeciesManager]; break;
        case 'archetype': aspect = [...state.ArchetypeManager]; break;
        case 'trait': aspect = [...state.TraitManager]; break;
      }

      // prompt the player to pick their aspect
      if (currentAspect !== 'archetype') {
        say(`  <b><white>Choose a <cyan>${currentAspect}</cyan><yellow>:</yellow></b>`);
      } else {
        say(`  <b><white>Choose an <cyan>${currentAspect}</cyan><yellow>:</yellow></b>`);
      }
      say('<b><white>---------------------------</white></b>');

      // declare array of menu options
      let options = [];

      // perform setup for traits
      if ((currentAspect === 'trait')) {
        if (args.traits === undefined) { args.traits = []; }

        aspect = aspect.filter(asp => !args.traits.includes(asp[0]));

        say(`      <b><cyan>${Config.get('startingTraits', 3) - args.traits.length}</cyan> <white>remaining<yellow>...</yellow></b>`);
        say('');
      }

      // add aspects to selection menu
      aspect.forEach(asp => {
        options.push({
          display: asp[0],
          onSelect: asp[0]
        });
      });

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
          const newArgs = Object.assign(args, {
            aspects: [currentAspect, ...args.aspects]
          })
          return socket.emit('6-choose-aspect', socket, newArgs);
        }

        // return the selected choice's menu object
        const selection = options.filter(o => !!o.onSelect)[choice];

        if (selection) {
          // if the selection is valid, return it
          choice = selection.onSelect;
        } else {
          // otherwise, prompt for the aspect again
          const newArgs = Object.assign(args, {
            aspects: [currentAspect, ...args.aspects]
          })
          return socket.emit('6-choose-aspect', socket, newArgs);
        }

        // if the choice was a trait, add it to the list of chosen traits
        if ((currentAspect === 'trait')) {
          args.traits.push(choice);
          
          // if the character has less traits than config's starting amount
          if ((args.traits.length < Config.get('startingTraits', 1))) {
            const newArgs = Object.assign(args, {
              aspects: [currentAspect, ...args.aspects]
            })
            return socket.emit('6-choose-aspect', socket, newArgs);
          }
        }

        // add the aspect to character creation arguments
        args[currentAspect] = choice;

        // if there are still more aspects to pick, do so
        if (args.aspects.length > 0) {
          socket.emit('6-choose-aspect', socket, args);
        // otherwise, continue to the next step
        } else {
          delete args.aspects;
          socket.emit('7-confirm-gender', socket, args);
        }
      });
    }
  };
};
