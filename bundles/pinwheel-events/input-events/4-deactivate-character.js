'use strict';

const sprintf = require('sprintf-js').sprintf;
const chalk = require('chalk');

/**
 * Player character deletion event
 */
module.exports = (srcPath) => {
  const EventUtil = require(srcPath + '/Util/EventUtil');
  const Logger = require(srcPath + 'Logger');

  return {
    event: state => (socket, args) => {
      let account = args.account;
      const say = EventUtil.genSay(socket);
      const write = EventUtil.genWrite(socket);

      // get a list of active characters on this account
      const characters = account.characters.filter(currChar => currChar.active === true);

      // MENU HEADER
      say("\r\n\n<b><white>+---------------------------------------+</b></white>");
      say("<b><white>| <yellow>= : = : = : = : = : = : = : = : = : =<white> |</b></white>");
      say("<b><white>+---------------------------------------+</b></white>");

      let options = [];

      // EMPTY MENU LINE
      say(sprintf('|  %-35s  |', ``));

      options.push({ display: "Deactivate..." });
      characters.forEach(char => {
        options.push({
          display: `${char.name}`,
          onSelect: () => {
            write(`<bold><white>Are you sure you want to deactivate ${char.name}<yellow>?</yellow></bold> [<green>y</green>/<red>n</red>]`);
            socket.once('data', confirmation => {
              say('');
              confirmation = confirmation.toString().trim().toLowerCase();

              if (!/[yn]/.test(confirmation)) {
                say('<b><white>Invalid option<yellow>...</yellow></b>')
                return socket.emit('3-menu', socket, args);
              }

              if (confirmation === 'n') {
                say('<b><white>Aborting<yellow>...</yellow></b>');
                return socket.emit('3-menu', socket, args);
              }

              say(`<b><white>Deactivating ${char.name}<yellow>...</yellow></b>`);
              account.deactivateCharacter(char.name);
              say('<b><white>Character deactivated<yellow>,<white> returning to main menu<yellow>...</yellow>');
              Logger.log(`${chalk.bold.yellow('Character deactivated')}: ${chalk.bold.white(char.name)} (${chalk.bold.cyan(account.username)})`);
              return socket.emit('3-menu', socket, args);
            });
          },
        });
      });

      options.push({ display: "" });
      
      options.push({
        display: 'Back',
        onSelect: () => {
          socket.emit('3-menu', socket, args);
        },
      });

      let optionI = 0;
      options.forEach((opt) => {
        if (opt.onSelect) {
          optionI++;
          say(sprintf('|            %-45s  |', `<cyan>[<b>${optionI}</b>]</cyan> ${opt.display}`));
        } else {
          say(sprintf('|            %-55s  |', `<bold><yellow>${opt.display}</yellow></bold>`));
        }
      });

      // EMPTY MENU LINE
      say(sprintf('|  %-35s  |', ``));

      say("\r<b><white>+---------------------------------------+</b></white>");
      say("<b><white>| <yellow>= : = : = : = : = : = : = : = : = : =<white> |</b></white>");
      say("<b><white>+---------------------------------------+</b></white>\n");

      socket.once('data', choice => {
        choice = choice.toString().trim();
        choice = parseInt(choice, 10) - 1;
        if (isNaN(choice)) {
          return socket.emit('3-menu', socket, args);
        }

        const selection = options.filter(o => !!o.onSelect)[choice];

        if (selection) {
          Logger.log(`${chalk.bold.cyan(`CHARACTER DEACTIVATION MENU`)}: Account ${chalk.yellow(account.username)} is deactivating ${chalk.yellow(selection.display)}...`);
          return selection.onSelect();
        }

        return socket.emit('3-menu', socket, args);
      });
    }
  };
};
