'use strict';

// TODO: format and make pretty/unique

module.exports = (srcPath, bundlePath) => {
  const Broadcast = require(srcPath + 'Broadcast');
  const ItemUtil = require(srcPath + 'Util/ItemUtil');

  return {
    aliases: ['worn'],
    usage: 'equipment',
    command: (state) => (arg, player) => {
      arg = arg.trim();

      if (!player.equipment.size) {
        return Broadcast.sayAt(player, "You are completely naked!");
      }

      Broadcast.sayAt(player, "Currently Equipped:");
      for (const [slot, item] of player.equipment) {
        Broadcast.sayAt(player, `  <${slot}> ${ItemUtil.display(item)}`);
        // if debug argument -v (verbose) is found
        if (arg === '-v') {
          const buf = ItemUtil.renderItem(state, item, player);
          Broadcast.sayAt(player, buf);
        }
      }
    }
  };
};
