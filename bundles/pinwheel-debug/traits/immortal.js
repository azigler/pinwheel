'use strict';

/**
 * Immortality trait
 * 
 * Characters with this trait do not age with time.
 * 
 * TIP: this currently does nothing (no time/aging yet)
 */
module.exports = srcPath => {
  return {
    name: 'immortal',
    description: 'You do not age with time.',

    setup: character => {
    }
  };
};
