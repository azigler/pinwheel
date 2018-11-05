'use strict';

/**
 * Keeps track of player quest progress
 *
 * @property {Player} player          Player that this tracker is assigned to
 * @property {Map}    completedQuests Map of active quests
 * @property {Map}    activeQuests    Map of completed quests
 */
class QuestTracker {
  constructor(player, active, completed) {
    this.player = player;
    this.activeQuests = new Map(active);
    this.completedQuests = new Map(completed);
  }

  /**
   * Proxy events to all active quests
   * @param {string} event
   * @param {...*}   args
   */
  emit(event, ...args) {
    for (const [ qid, quest ] of this.activeQuests) {
      quest.emit(event, ...args);
    }
  }

  /**
   * Whether a provided quest id is active for this player
   * @param {EntityReference} qid
   * @return {boolean}
   */
  isActive(qid) {
    return this.activeQuests.has(qid);
  }

  /**
   * Whether a provided quest id has been completed by this player
   * @param {EntityReference} qid
   * @return {boolean}
   */
  isComplete(qid) {
    return this.completedQuests.has(qid);
  }

  /**
   * Return the active quest for the provided quest id from this tracker
   * @param {EntityReference} qid
   * @return {Quest}
   */
  get(qid) {
    return this.activeQuests.get(qid);
  }

  /**
   * Complete an active quest on this tracker
   * @param {EntityReference} qid
   */
  complete(qid) {
    // if the tracker doesn't have this quest
    if (!this.isActive(qid)) {
      throw new Error('Quest not started');
    }

    // register this quest as completed on the tracker
    this.completedQuests.set(qid, {
      started: this.activeQuests.get(qid).started,
      completedAt: (new Date()).toJSON()
      // TODO: track how many times repeatable quests have been completed
    });

    // delete this quest from the active list
    this.activeQuests.delete(qid);
  }

  /**
   * Whether the player can start a provided quest
   * @param {Quest} quest
   * @return {boolean}
   */
  canStart(quest) {
    const qid = quest.entityReference;

    // if the player has completed the quest before and it's not repeatable, return false
    if (this.completedQuests.has(qid) && !quest.config.repeatable) {
      return false;
    }

    // if the quest isn't active and all prerequisite quests have been completed, return true
    return !this.isActive(qid) && quest.config.requires.every(requiresRef => {
      return this.isComplete(requiresRef);
    });
  }

  /**
   * Start a quest on this tracker
   * @param {Quest} quest
   * @fires Quest#start
   */
  start(quest) {
    const qid = quest.entityReference;

    // if the quest is already active
    if (this.activeQuests.has(qid)) {
      throw new Error('Quest already started');
    }

    quest.started = (new Date()).toJSON();
    this.activeQuests.set(qid, quest);
    quest.emit('start');
  }

  /**
   * Gather data to be persisted
   * @return {object}
   */
  serialize() {
    return {
      completed: [...this.completedQuests],
      active: [...this.activeQuests].map(([qid, quest]) =>  [qid, quest.serialize()]),
    };
  }

  /**
   * Hydrate the tracker
   * @param {GameState} state
   */
  hydrate(state) {
    for (const [qid, data] of this.activeQuests) {
      const quest = state.QuestFactory.create(state, qid, this.player, data.state);
      quest.started = data.started;
      quest.hydrate();

      this.activeQuests.set(qid, quest);
    }
  }
}

module.exports = QuestTracker;
