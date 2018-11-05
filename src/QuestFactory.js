'use strict';

const Quest = require('./Quest');
const Logger = require('./Logger');

/**
 * Store definitions of quests to allow for easy creation and assignment
 * 
 * @extends Map
 */
class QuestFactory extends Map {
  /**
   * Add a quest definition to this factory
   * @param {string}    areaName
   * @param {number}    id
   * @param {object}    config
   */
  add(areaName, id, config) {
    const entityRef = this.makeQuestKey(areaName, id);
    config.entityReference = entityRef;
    this.set(entityRef, { id, area: areaName, config });
  }

  /**
   * Create a new instance of a quest and attach it to a player
   * @param {GameState} GameState Game state
   * @param {string}    qid       Quest id
   * @param {Player}    player    Player that the quest will attach to
   * @param {?Array}    state     Starting internal state of the quest
   * @fires Player#questProgress
   * @fires Player#questStart
   * @fires Quest#progress
   * @fires Player#questTurnInReady
   * @fires Player#questComplete
   * @fires Player#questReward
   * @return {Quest}
   */
  create(GameState, qid, player, state = []) {
    // get quest definition
    const quest = this.get(qid);

    // if no quest definition
    if (!quest) {
      throw new Error(`Trying to create invalid quest id [${qid}]`);
    }

    // create new quest instance
    const instance = new Quest(GameState, quest.id, quest.config, player);

    // apply state
    instance.state = state;
    
    // add goals to quest from definition
    for (const goal of quest.config.goals) {
      const goalType = GameState.QuestGoalManager.get(goal.type);
      instance.addGoal(new goalType(instance, goal.config, player));
    }

    // configure quest instance to handle progress
    instance.on('progress', (progress) => {
      /**
       * @event Player#questProgress
       * @param {Quest} instance
       * @param {object} progress
       */
      player.emit('questProgress', instance, progress);
      player.save();
    });

    // configure quest instance to handle starting
    instance.on('start', () => {
      /**
       * @event Player#questStart
       * @param {Quest} instance
       */
      player.emit('questStart', instance);
      instance.emit('progress', instance.getProgress());
    });

    // configure quest instance to handle being turn-in ready
    instance.on('turn-in-ready', () => {
      /**
       * @event Player#questTurnInReady
       * @param {Quest} instance
       */
      player.emit('questTurnInReady', instance);
    });

    // configure quest instance to handle completion
    instance.on('complete', () => {
      /**
       * @event Player#questComplete
       * @param {Quest} instance
       */
      player.emit('questComplete', instance);
      player.questTracker.complete(instance.entityReference);

      // give quest rewards to player
      for (const reward of quest.config.rewards) {
        try {
          const rewardClass = GameState.QuestRewardManager.get(reward.type);

          if (!rewardClass) {
            throw new Error(`Quest [${qid}] has invalid reward type ${reward.type}`);
          }

          rewardClass.reward(GameState, instance, reward.config, player);
          /**
           * @event Player#questReward
           * @param {QuestReward} reward
           */
          player.emit('questReward', reward);
        } catch (e) {
          Logger.error(e.message);
        }
      }

      player.save();
    });

    return instance;
  }

  /**
   * Return an entity reference for a quest
   * @param {string} area   Name of area
   * @param {number} id     Id of quest
   * @return {string}
   */
  makeQuestKey(area, id) {
    return area + ':' + id;
  }
}

module.exports = QuestFactory;
