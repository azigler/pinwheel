'use strict';

const Effect = require('./Effect');

/**
 * Self-managing list of effects for an entity
 * 
 * @property {Character}            target  Target of this list
 * @property {Array<Object|Effect>} effects Array of serialized effects (Object) or actual Effect instances
 * 
 * @extends Set
 */
class EffectList extends Set {
  constructor(target, effects) {
    super(effects);
    this.target = target;
  }

  /**
   * Wrapper function for `Set.size`
   * @type {number}
   */
  get size() {
    this.validateEffects();
    return super.size;
  }

  /**
   * Check if effects are still current and remove them if not
   */
  validateEffects() {
    for (const effect of this) {
      if (!effect.isCurrent()) {
        this.remove(effect);
      }
    }
  }

  /**
   * Return this list's current effects as an array
   * @return {Array<Effect>}
   */
  entries() {
    this.validateEffects();
    return [...this];
  }

  /**
   * Whether this list has a type of effect
   * @param {string} type
   * @return {boolean}
   */
  hasEffectType(type) {
    // !!undefined = false
    return !!this.getByType(type);
  }

  /**
   * Search this list for a type of effect and return it if found
   * @param {string} type
   * @return {Effect}
   */
  getByType(type) {
    return [...this].find(effect => {
      return effect.config.type === type;
    });
  }

  /**
   * Proxy an event to all effects in the list
   * @param {string} event
   * @param {...*}   args
   */
  emit(event, ...args) {
    this.validateEffects();

    if (event === 'effectAdded' || event === 'effectRemoved') {
      // WARNING: don't forward these events on from the player as it would cause confusion between
      // Character#effectAdded and Effect#effectAdded. The former being when any effect gets added
      // to a character, the later is fired on an effect when it is added to a character.
      return;
    }

    for (const effect of this) {
      // if the effect is paused, skip it
      if (effect.paused) {
        continue;
      }

      // if the event is 'updateTick' and insufficient time has passed, skip it
      if (event === 'updateTick' && effect.config.tickInterval) {
        const sinceLastTick = Date.now() - effect.state.lastTick;
        if (sinceLastTick < effect.config.tickInterval * 1000) {
          continue;
        }
        effect.state.lastTick = Date.now();
        effect.state.ticks++;
      }

      // emit the event to the effect
      effect.emit(event, ...args);
    }
  }

  /**
   * Add an effect to this list
   * @param {Effect} effect
   * @fires Effect#effectStackAdded
   * @fires Effect#effectStackRefreshed
   * @fires Effect#effectAdded
   * @fires Character#effectAdded
   */
  add(effect) {
    // only proceed if the effect has been hydrated
    if (effect instanceof Effect) {
      for (const activeEffect of this) {
        if (effect.config.type === activeEffect.config.type) {
          if (activeEffect.config.maxStacks && activeEffect.state.stacks < activeEffect.config.maxStacks) {
            activeEffect.state.stacks = Math.min(activeEffect.config.maxStacks, activeEffect.state.stacks + 1);

            /**
             * @event Effect#effectStackAdded
             * @param {Effect} effect The new effect that is trying to be added
             */
            activeEffect.emit('effectStackAdded', effect);
            return true;
          }

          if (activeEffect.config.refreshes) {
            /**
             * @event Effect#effectRefreshed
             * @param {Effect} effect The new effect that is trying to be added
             */
            activeEffect.emit('effectRefreshed', effect);
            return true;
          }

          if (activeEffect.config.unique) {
            return false;
          }
        }
      }

      super.add(effect);

      /**
       * @event Effect#effectAdded
       */
      effect.emit('effectAdded');

      /**
       * @event Character#effectAdded
       */
      this.target.emit('effectAdded', effect);
      effect.on('remove', () => this.remove(effect));
      return true;
    }
  }

  /**
   * Deactivate and remove an effect from this list
   * @param {Effect} effect
   * @fires Character#effectRemoved
   * @throws ReferenceError
   */
  remove(effect) {
    if (!this.has(effect)) {
      throw new ReferenceError("Trying to remove effect that was never added");
    }

    effect.deactivate();
    this.delete(effect);

    /**
     * @event Character#effectRemoved
     */
    this.target.emit('effectRemoved');
  }

  /**
   * Return the effective maximum value of an attribute for a target
   * effected by this list (before modified by delta).
   * @param {Atrribute} attr
   * @return {number} minimum of 0
   */
  evaluateAttribute(attr) {
    this.validateEffects();

    let attrName  = attr.name;
    let attrValue = attr.base || 0;

    for (const effect of this) {
      // if the effect is paused, skip it
      if (effect.paused) {
        continue;
      }

      attrValue = effect.modifyAttribute(attrName, attrValue);
    }

    return Math.max(attrValue, 0) || 0;
  }

  /**
   * Return modified incoming damage to this list's target based on its effects
   * @param {Damage} damage
   * @param {number} currentAmount
   * @return {number} minimum of 0
   */
  evaluateIncomingDamage(damage, currentAmount) {
    this.validateEffects();

    for (const effect of this) {
      currentAmount = effect.modifyIncomingDamage(damage, currentAmount);
    }

    return Math.max(currentAmount, 0) || 0;
  }

  /**
   * Return modified outgoing damage from this list's target based on its effects
   * @param {Damage} damage
   * @param {number} currentAmount
   * @return {number} minimum of 0
   */
  evaluateOutgoingDamage(damage, currentAmount) {
    this.validateEffects();

    for (const effect of this) {
      currentAmount = effect.modifyOutgoingDamage(damage, currentAmount);
    }

    return Math.max(currentAmount, 0) || 0;
  }

  /**
   * Gather data to be persisted
   * @return {Array}
   */
  serialize() {
    this.validateEffects();

    let serialized = [];
    for (const effect of this) {
      if (!effect.config.persists) {
        continue;
      }

      serialized.push(effect.serialize());
    }

    return serialized;
  }

  /**
   * Hydrate the list with each effect's state
   * @param {GameState} state
   */
  hydrate(state) {
    const effects = this;
    this.clear();
    for (const newEffect of effects) {
      const effect = state.EffectFactory.create(newEffect.id, this.target);
      effect.hydrate(state, newEffect);
      this.add(effect);
    }
  }
}

module.exports = EffectList;
