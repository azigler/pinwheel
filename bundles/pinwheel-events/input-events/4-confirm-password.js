'use strict';

const chalk = require('chalk');

/**
 * Account password confirmation event
 */
module.exports = (srcPath) => {
  const EventUtil = require(srcPath + '/Util/EventUtil');
  const Logger = require(srcPath + './Logger');

  return {
    event: state => (socket, args) => {
      const say = EventUtil.genSay(socket);

      if (!args.dontwelcome) {
        say("<white><b>Confirm your password<yellow>:</yellow></b> ");
        socket.command('toggleEcho');
      }

      socket.once('data', pass => {
        socket.command('toggleEcho');

        if (!args.account.checkPassword(pass.toString().trim())) {
          say("<red>Passwords do not match.</red>");
          return socket.emit('3-set-password', socket, args);
        }

        if (args.newAccount === true) {
          say('<b><white>Creating account... </white><green>DONE<yellow>!</yellow></b>');
          Logger.log(`${chalk.bold.green('New account created:')} ${chalk.bold.white(args.account.username)} (${chalk.bold.cyan(socket.ipAddress)})`);
        }

        return socket.emit(args.nextStage, socket, args);
      });
    }
  };
};
