'use strict';

const EventManager = require('./EventManager');

/**
 * BehaviorManager keeps a Map of [BehaviorName:EventManager] which is used
 * during Item and NPC hydrate methods to attach events
 * 
 * @extends Map
 */
class BehaviorManager extends Map {

  /**
   * Add a listener to an event manager
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
