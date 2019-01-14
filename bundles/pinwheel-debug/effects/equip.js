'use strict';

/**
 * Effect used for equipment stats
 */
module.exports = srcPath => {
  const Flag = require(srcPath + 'EffectFlag');

  return {
    config: {
      name: 'Equip',
      description: '',
      type: 'equip',
      hidden: true,
    },
    flags: [Flag.BUFF],
    state: {
      slot: null,
      stats: {}
    },
    modifiers: {
      attributes: function (attribute, current) {
        if (!(attribute in this.state.stats)) {
          return current;
        }

        return current + this.state.stats[attribute];
      }
    },
    listeners: {
      unequip: function (slot, item) {
        if (slot === this.state.slot) {
          this.remove();
        }
      },
    }
  };
};
