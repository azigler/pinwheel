'use strict';

/**
 * Save the player's account and character
 */
module.exports = (srcPath) => {
  const Broadcast = require(srcPath + 'Broadcast');

  return {
    usage: 'save',
    command: state => (args, player) => {
      player.account.save(() => {
        player.save(() => {
          Broadcast.sayAt(player, "<b><white>Account and character saved</white><yellow>!</yellow></b>");
        });
      })
    }
  };
};
