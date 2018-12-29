'use strict';

/**
 * Account creation event
 */
module.exports = (srcPath) => {
  const Account = require(srcPath + 'Account');
  const EventUtil = require(srcPath + '/Util/EventUtil');

  return {
    event: (state) => (socket, name) => {
      const write = EventUtil.genWrite(socket);
      const say = EventUtil.genSay(socket);
      let newAccount = null;

      // confirm the desired account username
      write(`<bold><white>Do you want your account<yellow>'</yellow>s public username to be <cyan>${name}</cyan><yellow>?</yellow></bold> [<green>y</green>/<red>n</red>]`);

      socket.once('data', data => {
        data = data.toString('utf8').trim();
        data = data.toLowerCase();

        // if the user agrees
        if (data === 'y' || data === 'yes') {
          // create a new account
          newAccount = new Account({
            username: name
          });

          // set account password
          return socket.emit('3-set-password', socket, {
            account: newAccount,
            nextStage: '4-create-character',
            newAccount: true
          });
          // if the user disagrees
        } else if (data && data === 'n' || data === 'no') {
          // abort account creation
          say("<red>Aborting account creation...</red>");
          return socket.emit('1-login', socket);
        }

        // if the user neither agrees nor disagrees
        return socket.emit('2-create-account', socket, name);
      });
    }
  };
};
