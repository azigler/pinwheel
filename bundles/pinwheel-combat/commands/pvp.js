'use strict';

module.exports = (srcPath) => {
  const Broadcast = require(srcPath + 'Broadcast');

  return {
    command : (state) => (args, player) => {
      const previousPvpSetting = player.getMeta('pvp') || false;
      const newPvpSetting = !previousPvpSetting;
      player.setMeta('pvp', newPvpSetting);

      const message = newPvpSetting ?
        '<bold>You can now engage in player versus player </bold>(PvP)<bold> combat</bold>.' :
        '<bold>You can no longer enter player versus player </bold>(PvP)<bold> combat</bold>.';
      Broadcast.sayAt(player, message);
    }
  };
};
