'use strict';

/**
 * Behavior for decaying items, such as corpses
 */
module.exports = srcPath => {
  const Broadcast = require(srcPath + 'Broadcast');
  const ItemUtil = require(srcPath + '/Util/ItemUtil');

  return {
    listeners: {
      updateTick: state => function (config) {
        const now = Date.now();

        // TIP: default duration is 1 minute
        let { duration = 60 } = config;
        duration = duration * 1000;
        this.decaysAt = this.decaysAt || now + duration;

        if (now >= this.decaysAt) {
          this.emit('decay');
        } else {
          this.timeUntilDecay = this.decaysAt - now;
        }
      },

      decay: state => function (item) {
        const { room, type, belongsTo } = this;

        if (belongsTo) {
          const owner = this.findOwner();
          if (owner) {
            Broadcast.sayAt(owner, `Your ${ItemUtil.display(this)} has decayed into nothing!`);
          } else {
            Broadcast.sayAt(belongsTo, `${ItemUtil.display(this)} has decayed into nothing!`);
          }
        }

        // helper function for removing contents from a decayed container
        // TIP: right now, this behavior is only used by corpses and their
        // contents aren't spawned by rooms, but we still need to check
        // if the corpse contains any items that were spawned somewhere
        // (like if a character put a spawned item inside the corpse)
        const removeContents = function(item) {
          if (item.inventory && item.inventory.items !== []) {
            item.inventory.forEach(item => {
              if (item.source) {
                const sourceArea = state.AreaManager.getArea(item.source.area);
                const sourceRoom = sourceArea.getRoomById(item.source.room);
                sourceRoom.removeSpawnedItem(item);
              }
              if (item.inventory) {
                removeContents(item);
              }
              state.ItemManager.remove(item, state);
            });
          }
        }

        removeContents(this);
        state.ItemManager.remove(this, state);
      }
    }
  };
};
