'use strict';

const EventManager = require('./EventManager');

/**
 * BehaviorManager keeps a map of BehaviorName:EventManager which is used
 * during Item and NPC hydrate() methods to attach events
 */
class BehaviorManager extends Map {
  /**
   * @param {string}   behaviorName
   * @param {Function} listener
   */
  addListener(behaviorName, event, listener) {
    if (!this.has(behaviorName)) {
      this.set(behaviorName, new EventManager());
    }

    this.get(behaviorName).add(event, listener);
  }
}

module.exports = BehaviorManager;
