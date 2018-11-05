'use strict';

const EventEmitter = require('events');

/**
 * Representation of a quest
 * 
 * @property {number}       id                  Id of quest
 * @property {string}       entityReference     Entity reference for quest
 * @property {string}       config.title        Title of quest
 * @property {string}       config.description  Description of quest
 * @property {string}       config.completionMessage Message broadcasted to player upon completion
 * @property {object}       config.goals        Array of objects representing goal definitions for this quest
 * @property {object}       config.rewards      Array of objects representing reward definitions for this quest
 * @property {?Array<string>} config.requires   Array of entity references for prerequisite quests
 * @property {?boolean}     config.autoComplete Whether this quest automatically completes when all goals are met
 * @property {?boolean}     config.repeatable   Whether this quest can be repeated once completed
 * @property {Player}       player              Player for which this quest was initiated
 * @property {Array<QuestGoal>} goals           Array of QuestGoals for this quest
 * @property {GameState}    GameState           Game state
 * 
 * @extends EventEmitter
 */
class Quest extends EventEmitter {
  constructor(GameState, id, config, player) {
    super();

    this.id = id;
    this.entityReference = config.entityReference;

    this.config = Object.assign({
      title: 'Missing Quest Title',
      description: 'Missing Quest Description',
      completionMessage: null,
      goals: [],
      rewards: [],
      requires: [],
      autoComplete: false,
      repeatable: false,
    }, config);

    this.player = player;
    this.goals = [];
    this.GameState = GameState;
  }

  /**
   * Proxy events to this quest's goals
   * @param {string} event
   * @param {...*}   args
   */
  emit(event, ...args) {
    super.emit(event, ...args);

    if (event === 'progress') {
      // don't proxy the `progress` event
      return;
    }

    // proxy the event to each goal for this quest
    this.goals.forEach(goal => {
      goal.emit(event, ...args);
    });
  }

  /**
   * Add a goal to this quest
   * @param {QuestGoal} goal
   */
  addGoal(goal) {
    this.goals.push(goal);
    // when the goal is updated, check status of quest
    goal.on('progress', () => this.onProgressUpdated());
  }

  /**
   * Return an object representing the player's overall progress on this quest
   * @return {{ percent: number, display: string }}
   */
  getProgress() {
    let overallPercent = 0;
    let overallDisplay = [];

    this.goals.forEach(goal => {
      const goalProgress = goal.getProgress();
      overallPercent += goalProgress.percent;
      overallDisplay.push(goalProgress.display);
    });

    return {
      percent: Math.round(overallPercent / this.goals.length),
      display: overallDisplay.join('\r\n'),
    };
  }

  /**
   * Check status of quest when a goal's progress is updated
   * @fires Quest#turn-in-ready
   * @fires Quest#progress
   */
  onProgressUpdated() {
    const progress = this.getProgress();

    // if all goals on this quest are complete
    if (progress.percent >= 100) {
      // if the quest autocompletes
      if (this.config.autoComplete) {
        this.complete();
      } else {
        /**
         * @event Quest#turn-in-ready
         */
        this.emit('turn-in-ready');
      }
      return;
    }

    /**
     * @event Quest#progress
     * @param {object} progress
     */
    this.emit('progress', progress);
  }

  /**
   * Complete this quest
   * @fires Quest#complete
   */
  complete() {
    /**
     * @event Quest#complete
     */
    this.emit('complete');

    // complete each goal on this quest
    for (const goal of this.goals) {
      goal.complete();
    }
  }

  /**
   * Gather data to be persisted
   * @return {object}
   */
  serialize() {
    return {
      state: this.goals.map(goal => goal.serialize())
    };
  }

  /**
   * Hydrate the quest
   */
  hydrate() {
    this.state.forEach((goalState, i) => {
      this.goals[i].hydrate(goalState.state);
    });
  }
}

module.exports = Quest;
