'use strict';

const TypeUtil = require('./Util/TypeUtil');

/**
 * Generic array hash table to store listener definitions in a `Map`
 * Keys are event names and values are the `Sets` of listeners to be
 * attached for that event
 * 
 * @extends Map
 */
class EventManager extends Map {
  /**
   * Add an event to a Set of listeners
   * @param {string}   eventName
   * @param {Function} listener
   */
  add(eventName, listener) {
    if (!this.has(eventName)) {
      this.set(eventName, new Set());
    }
    this.get(eventName).add(listener);
  }

  /**
   * Attach all currently added events to the given emitter
   * @param {EventEmitter} emitter
   * @param {Object} config
   */
  attach(emitter, config) {
    for (const [ event, listeners ] of this) {
      for (const listener of listeners) {
        if (config) {
          emitter.on(event, listener.bind(emitter, config));
        } else {
          emitter.on(event, listener.bind(emitter));
        }
      }
    }
  }

  /**
   * Remove all listeners for a given emitter or only those for the given events.
   * If no events are given, it will remove all listeners from all events defined
   * in this manager.
   *
   * Warning: This will remove _all_ listeners for a given event list, this includes
   * listeners not in this manager but attached to the same event
   *
   * @param {EventEmitter}  emitter
   * @param {?string|iterable} events Optional name or list of event names to remove listeners from
   */
  detach(emitter, events) {
    if (typeof events === 'string') {
      events = [events];
    } else if (!events) {
      events = this.keys();
    } else if (!TypeUtil.iterable(events)) {
      throw new TypeError('List of events is not iterable');
    }

    for (const event of events) {
      emitter.removeAllListeners(event);
    }
  }
}

module.exports = EventManager;
