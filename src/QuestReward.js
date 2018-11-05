'use strict';

/**
 * Representation of a quest reward
 */
class QuestReward {
  /**
   * Give the reward to the player
   * @param {GameState} GameState
   * @param {Quest}     quest   Quest that this reward is for
   * @param {object}    config
   * @param {Player}    player
   */
  static reward(GameState, quest, config, player) {
    throw new Error('Quest reward not implemented');
  }

  /**
   * Render the reward string
   * @return string
   */
  static display(GameState, quest, config, player) {
    throw new Error('Quest reward display not implemented');
  }
}

module.exports = QuestReward;

