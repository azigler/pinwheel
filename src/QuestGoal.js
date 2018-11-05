'use strict';

const EventEmitter = require('events');

/**
 * Representation of a quest goal
 * 
 * @property {Quest}    quest   Quest that this goal is for
 * @property {object}   config  Configuration object for this goal
 * @property {Player}   player  Player attached to this goal
 * @property {object}   state   Internal state for goal
 *
 * @extends EventEmitter
 */
class QuestGoal extends EventEmitter {
  constructor(quest, config, player) {
    super();

    this.quest = quest;
    this.config = config;
    this.player = player;
    this.state = {};
  }

  /**
   * Return an object representing the player's progress towards this goal
   * @return {{ percent: number, display: string}}
   */
  getProgress() {
    return {
      percent: 0,
      display: '[WARNING] Quest does not have progress display configured.'
    };
  }

  /**
   * Perform any post-quest clean-up
   */
  complete() {
  }

  /**
   * Gather data to be persisted
   * @return {object}
   */
  serialize() {
    return {
      state: this.state,
      progress: this.getProgress(),
      config: this.config,
    };
  }

  /**
   * Hydrate the quest goal
   * @param {object} state  Internal state of this goal
   */
  hydrate(state) {
    this.state = state;
  }
}

module.exports = QuestGoal;
