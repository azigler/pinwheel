'use strict';

const chalk = require('chalk');

/**
 * Login event
 */
module.exports = (srcPath) => {
  const Data = require(srcPath + 'Data');
  const ValidationUtil = require(srcPath + 'Util/ValidationUtil');
  const EventUtil = require(srcPath + '/Util/EventUtil');
  const Logger = require(srcPath + 'Logger');

  return {
    event: state => (socket, args) => {
      const say = EventUtil.genSay(socket);

      if (!args || !args.dontwelcome) {
        say('<b><white>Welcome<yellow>,<white> what is your username</white><yellow>?</yellow></b> ');
      }

      socket.once('data', name => {
        name = name.toString().trim();

        // validate the input
        const invalid = ValidationUtil.validateName(name);

        // if the input is invalid, prompt again
        if (invalid) {
          say(invalid);
          return socket.emit('1-login', socket);
        }

        name = name[0].toUpperCase() + name.slice(1);
        let account = Data.exists('account', name);

        // if the account doesn't exist, try to create it
        if (!account) {
          return socket.emit('2-create-account', socket, name);
        }

        // load the account
        account = state.AccountManager.loadAccount(name);

        // if the account is banned
        if (account.banned) {
          say('<b><red>This account has been banned.</red></b>\r\n');
          Logger.log(`${chalk.bold.red('Banned account attempted to log in')}: ${chalk.bold.white(account.username)} (${chalk.bold.cyan(socket.ipAddress)})`);
          socket.end();
          return;
        }

        // if the account is inactive
        if (account.active === false) {
          say('<b><yellow>This account has been deactivated.</yellow></b>\r\n');
          Logger.log(`${chalk.bold.yellow('Deactivated account attempted to log in')}: ${chalk.bold.white(account.username)} (${chalk.bold.cyan(socket.ipAddress)})`);
          socket.end();
          return;
        }

        // prompt for the account's password
        return socket.emit('2-password', socket, { account });
      });
    }
  };
};
