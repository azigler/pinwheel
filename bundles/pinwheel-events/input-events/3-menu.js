'use strict';

const sprintf = require('sprintf-js').sprintf;
const chalk = require('chalk');

/**
 * Account menu event
 */
module.exports = (srcPath) => {
  const Broadcast = require(srcPath + 'Broadcast');
  const EventUtil = require(srcPath + '/Util/EventUtil');
  const Config = require(srcPath + 'Config');
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
      say("<b><white>| <yellow>= : = :  <cyan>WELCOME TO PINWHEEL</cyan>  <yellow>: = : =<white> |</b></white>");
      say("<b><white>+---------------------------------------+</b></white>");

      // declare array of menu options
      let options = [];

      // determine if this account can create a new character
      const maxCharacters = Config.get("maxCharacters", 3);
      const canAddCharacter = characters.length < maxCharacters;

      // MENU OPTION: PLAY CHARACTER
      if (characters.length) {
        // EMPTY MENU LINE
        options.push({ display: "" });

        options.push({ display: "Play as..." });
        characters.forEach(char => {
          options.push({
            display: char.name,
            onSelect: () => {
              handleMultiplaying(char)
                .then(() => {
                  const player = state.PlayerManager.loadPlayer(state, account, char.name);
                  player.socket = socket;
                  socket.emit('done', socket, { player });
                })
                .catch(err => {
                  Logger.warn(err);
                  say('<b><red>Failed to log in to your character. The error has been logged, please contact an administrator.</red></b>');
                  socket.end();
                });
            },
          });
        });
      }

      /**
       * Check if multiplaying is allowed
       * @param {Player} selectedChar
       * @return {*}
       */
      function handleMultiplaying(selectedChar) {
        const canMultiplay = Config.get("allowMultiplay", true);

        // if multiplaying is not allowed, kick off other characters before connecting this one
        if (!canMultiplay) {
          const kickIfMultiplaying = kickIfLoggedIn.bind(null, 'Replaced. No multiplaying allowed.');
          const checkAllCharacters = [...characters].map(kickIfMultiplaying);
          return Promise.all(checkAllCharacters);
        // if multiplaying is allowed, check if the player character is already logged in
        } else if (selectedChar) {
          return kickIfLoggedIn("Replaced by a new session.", selectedChar);
        }
      }

      /**
       * Check if the player character is already logged in
       * @param {string} message
       * @param {Player} character
       * @return {*}
       */
      function kickIfLoggedIn(message, character) {
        const otherPlayer = state.PlayerManager.getPlayer(character.name);
        if (otherPlayer) {
          return bootPlayer(otherPlayer, message);
        }
        return Promise.resolve();
      }

      /**
       * Generate a function for writing colored output to a socket
       * @param {Player} player
       * @param {string} reason
       * @return {*}
       */
      function bootPlayer(player, reason) {
        return new Promise((resolve, reject) => {
          try {
            player.save(() => {
              Broadcast.sayAt(player, reason);
              player.socket.on('close', resolve)
              const closeSocket = true;
              state.PlayerManager.removePlayer(player, closeSocket);
              Logger.warn(`${chalk.bold.red('Booted')} ${chalk.bold.red(player.name)}: ${chalk.yellow(reason)}`);
            });
          } catch (err) {
            return reject('Failed to save and close player.');
          }
        });
      }

      // EMPTY MENU LINE
      options.push({ display: "" });

      // MENU OPTION: CREATE CHARACTER
      if (canAddCharacter) {
        options.push({
          display: 'Create a Character',
          onSelect: () => {
            handleMultiplaying();
            socket.emit('4-create-character', socket, { account });
          },
        });
      }

      // MENU OPTION: DEACTIVATE CHARACTER
      if (characters.length) {
        options.push({
          display: 'Deactivate a Character',
          onSelect: () => {
            socket.emit('4-deactivate-character', socket, args);
          },
        });
      }

      // EMPTY MENU LINE
      options.push({ display: "" });

      // MENU OPTION: CHANGE PASSWORD
      options.push({
        display: 'Change Password',
        onSelect: () => {
          socket.emit('3-set-password', socket, { account, nextStage: '3-menu' });
        },
      });

      // MENU OPTION: DEACTIVATE ACCOUNT
      options.push({
        display: 'Deactivate Account',
        onSelect: () => {
          say('<bold><white>This can only be reversed by an administrator<yellow>.</yellow>');
          say('<b><white>All characters on this account will also be deactivated<yellow>.</yellow></bold>');
          say('');
          write(`<bold><white>Are you sure you want to deactivate this account<yellow>?</yellow></bold> [<green>y</green>/<red>n</red>]`);
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

              say(`<b><white>Deactivating your account<yellow>...</yellow></b>`);
              account.deactivateAccount();
              say('<b><white>Account deactivated<yellow>,<white> now disconnecting<yellow>...</yellow>');
              socket.end();
              Logger.log(`${chalk.bold.yellow('Account deactivated')}: ${chalk.bold.white(args.account.username)} (${chalk.bold.cyan(socket.ipAddress)})`);
            });
        },
      });

      // EMPTY MENU LINE
      options.push({ display: "" });

      // MENU OPTION: QUIT
      options.push({
        display: 'Log Out',
        onSelect: () => {
          say('<b><white>Goodbye<yellow>!</yellow></b>');
          socket.end();
        }
      });

      // display menu of options
      let optionI = 0;
      options.forEach((opt) => {
        if (opt.onSelect) {
          optionI++;
          say(sprintf('|       %-50s  |', `<cyan>[<b>${optionI}</b>]</cyan> ${opt.display}`));
        } else {
          say(sprintf('|       %-60s  |', `<bold><yellow>${opt.display}</yellow></bold>`));
        }
      });

      // EMPTY MENU LINE
      say(sprintf('|  %-35s  |', ``));

      say("\r<b><white>+---------------------------------------+</b></white>");
      say("<b><white>| <yellow>= : = : = : = : = : = : = : = : = : =<white> |</b></white>");
      say("<b><white>+---------------------------------------+</b></white>\n");

      // process user input for the menu
      socket.once('data', choice => {
        choice = choice.toString().trim();
        choice = parseInt(choice, 10) - 1;

        // if the input is invalid, show the menu again
        if (isNaN(choice)) {
          return socket.emit('3-menu', socket, args);
        }

        // return the selected choice's menu object
        const selection = options.filter(o => !!o.onSelect)[choice];

        if (selection) {
          Logger.log(`${chalk.bold.cyan(`MAIN MENU`)}: Account ${chalk.yellow(account.username)} has selected ${chalk.yellow(selection.display)}`);

          // execute the choice
          return selection.onSelect();
        }

        return socket.emit('3-menu', socket, args);
      });
    }
  };
};
