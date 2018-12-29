'use strict';

/**
 * Pinwheel's default intro event for a new socket connection
 */
module.exports = (srcPath) => {
  const Data = require(srcPath + 'Data');
  const EventUtil = require(srcPath + '/Util/EventUtil');

  return {
    event: state => socket => {
      // load and display the MotD (Message of the Day)
      const motd = Data.loadMotd();
      if (motd) {
        EventUtil.genSay(socket)(motd);
      }

      // prompt user to log in
      return socket.emit('1-login', socket);
    }
  };
};
