'use strict';

/**
 * Tester archetype
 * 
 * Characters with this archetype have (at least) the 'TESTER' PlayerRole.
 */
module.exports = srcPath => {
  const PlayerRole = require(srcPath + 'PlayerRole');

  return {
    name: 'tester',
    description: 'You are a game tester.',

    setup: character => {
      if (character.role >= PlayerRole.TESTER) {
        return;
      }
      character.role = PlayerRole.TESTER;
    }
  }
};
