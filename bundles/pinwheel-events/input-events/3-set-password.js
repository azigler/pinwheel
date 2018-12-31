'use strict';

/**
 * Account password setting event
 */
module.exports = (srcPath) => {
  const EventUtil = require(srcPath + '/Util/EventUtil');
  const Config = require(srcPath + 'Config');

  return {
    event: state => (socket, args) => {
      const say = EventUtil.genSay(socket);

      const minPasswordLength = Config.get('minPasswordLength', 6)

      say(`<cyan><b>Your password must be at least ${minPasswordLength} characters<yellow>.</b>`);
      say('<white><b>Enter your account password<yellow>:</yellow></b> ');

      socket.command('toggleEcho');
      socket.once('data', pass => {
        socket.command('toggleEcho');

        pass = pass.toString().trim();

        if (!pass) {
          say('<red>You must use a password<yellow>.</red>');
          return socket.emit('3-set-password', socket, args);
        }

        if (pass.length < minPasswordLength) {
          say('<b><cyan>Your password is not long enough<yellow>.</yellow></b>');
          return socket.emit('3-set-password', socket, args);
        }

        // hash the password
        args.account.setPassword(pass);

        // update the account
        state.AccountManager.addAccount(args.account);
        args.account.save();

        // confirm the password
        socket.emit('4-confirm-password', socket, args);
      });
    }
  };
};
