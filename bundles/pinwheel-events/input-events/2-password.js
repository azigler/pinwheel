'use strict';

const chalk = require('chalk');

/**
 * Account password verification event
 */
module.exports = (srcPath) => {
  const EventUtil = require(srcPath + '/Util/EventUtil');
  const Config = require(srcPath + 'Config');
  const Logger = require(srcPath + 'Logger');

  let passwordAttempts = {};
  const maxFailedLoginAttempts = Config.get('maxFailedLoginAttempts', 3);

  return {
    event: state => (socket, args) => {
      const write = EventUtil.genWrite(socket);
      const say = EventUtil.genSay(socket);

      // get account name
      let name = args.account.username;

      // if the account name hasn't attempted login with this socket
      if (!passwordAttempts[name]) {
        // set login attempts to 0
        passwordAttempts[name] = 0;
      }

      // if the user has failed login too many times
      if (passwordAttempts[name] >= maxFailedLoginAttempts) {
        write("<b><red>Password attempts exceeded.</red></b>\r\n");
        passwordAttempts[name] = 0;
        socket.end();
        Logger.log(`${chalk.bold.red('Password attempts exceeded for account')}: ${chalk.bold.white(args.account.username)} (${chalk.bold.cyan(socket.ipAddress)})`);
        return false;
      }

      // prompt the user for their password
      say("<b><white>Enter your password<yellow>:</b></yellow> ");
      socket.command('toggleEcho');

      socket.once('data', pass => {
        socket.command('toggleEcho');

        // if the password is incorrect
        if (!args.account.checkPassword(pass.toString().trim())) {
          write("<red>Incorrect password.</red>\r\n");
          passwordAttempts[name]++;

          return socket.emit('2-password', socket, args);
        }

        // log the user in to their account
        Logger.log(`${chalk.bold.green('Account logged in')}: ${chalk.bold.white(args.account.username)} (${chalk.bold.cyan(socket.ipAddress)})`);
        return socket.emit('3-menu', socket, { account: args.account });
      });
    }
  };
};
