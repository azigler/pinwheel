'use strict';

const EventManager = require('./EventManager');
const Effect = require('./Effect');

/**
 * Stores definitions of effects
 * 
 * @extends Map
 */
class EffectFactory extends Map {
  /**
   * Add an effect to the factory
   * @param {string} id
   * @param {{config: Object<string,*>, listeners: Object<String,function (...*)>}} config
   */
  add(id, config) {
    if (this.has(id)) {
      return;
    }

    let definition = Object.assign({}, config);
    delete definition.listeners;
    const listeners = config.listeners || {};

    const eventManager = new EventManager();
    for (const event in listeners) {
      eventManager.add(event, listeners[event]);
    }

    this.set(id, { definition, eventManager });
  }

  /**
   * Return an effect from an id's definition (with optional overrides)
   * @param {string}      id      Effect id
   * @param {Character}   target  Target of effect
   * @param {?object}     config  Effect.config override
   * @param {?object}     state   Effect.state override
   * @return {Effect}
   */
  create(id, target, config = {}, state = {}) {
    const entry = this.get(id);
    let def = Object.assign({}, entry.definition);
    def.config = Object.assign(def.config, config);
    def.state = Object.assign(def.state || {}, state);
    const effect = new Effect(id, def, target);
    entry.eventManager.attach(effect);

    return effect;
  }
}

module.exports = EffectFactory;
