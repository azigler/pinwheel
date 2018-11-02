'use strict';

const EventEmitter = require('events');
const EffectFlag = require('./EffectFlag');

/**
 * Representation of an effect on a character
 * 
 * @property {string}     id                    Filename without extension
 * @property {Character}  target                Character this effect is affecting
 * @property {string}     config.name           Name of effect
 * @property {string}     config.description    Description of effect
 * @property {number}     config.duration       Total duration of effect in miliseconds
 * @property {boolean}    config.autoActivate   Whether this effect immediately activates itself when added to the target
 * @property {boolean}    config.unique         Whether this effect is unique (if not, multiple effects of this `config.type` can be applied at once)
 * @property {boolean}    config.hidden         Whether this effect is hidden from the character's effect list
 * @property {boolean}    config.refreshes      Whether applying effects with the same type will it trigger an effectRefresh instead
 * @property {number}     config.maxStacks      Maximum amount of refreshed stacks that can be active on this effect
 * @property {boolean}    config.persists       Whether the effect will persist on the player
 * @property {string}     config.type           Type of effect (used to identify stacks)
 * @property {number|boolean} config.tickInterval Number of seconds between calls to the `updateTick` listener, or false
 * @property {number}     startedAt             Date.now() timestamp in miliseconds that this effect became active
 * @property {boolean}    paused                Timestamp this effect was paused, or null if unpaused
 * @property {Array<EffectFlag>} flags          Array of flags for this effect
 * @property {object}     modifiers             Modifier functions for attributes/abilities and incoming/outgoing damage
 * @property {number}     elapsed               Number of miliseconds since effect was activated
 * @property {number}     remaining             Number of miliseconds remaining for effect
 * @property {object}     state                 State of this effect
 * 
 * @extends EventEmitter
 * @listens Effect#effectAdded
 */
class Effect extends EventEmitter {
  constructor(id, def, target) {
    super();

    this.id = id;
    this.target = target;

    this.config = Object.assign({
      name: 'Unnamed Effect',
      description: 'Undescribed effect.',
      duration: Infinity,
      autoActivate: true,
      unique: true,
      hidden: false,
      refreshes: false,
      maxStacks: 0,
      persists: true,
      type: 'undef',
      tickInterval: false
    }, def.config);

    this.startedAt = 0;
    this.paused = 0;

    this.flags = def.flags || [];

    this.modifiers = Object.assign({
      attributes: {},
      incomingDamage: (damage, current) => current,
      outgoingDamage: (damage, current) => current,
    }, def.modifiers);

    // internal state persists (default state is loaded from def.state)
    this.state = Object.assign({}, def.state);

    // if this effect has stacks, set this effect as the first stack
    if (this.config.maxStacks) {
      this.state.stacks = 1;
    }

    // if this effect has a tickInterval, set up state for tracking intervals
    if (this.config.tickInterval && !this.state.tickInterval) {
      this.state.lastTick = -Infinity;
      this.state.ticks = 0;
    }

    // if this effect automatically activates when created, activate it now at creation
    if (this.config.autoActivate) {
      this.on('effectAdded', this.activate);
    }
  }

  /**
   * Getter for name
   * @type {string}
   */
  get name() {
    return this.config.name;
  }

  /**
   * Getter for description
   * @type {string}
   */
  get description() {
    return this.config.description;
  }

  /**
   * Getter for duration
   * @type {number}
   */
  get duration() {
    return this.config.duration;
  }

  /**
   * Setter for duration
   * @type {number}
   */
  set duration(dur) {
    this.config.duration = dur;
  }

  /**
   * Getter for elapsed time in milliseconds since effect was activated
   * @type {number}
   */
  get elapsed () {
    // if the effect hasn't started, return null
    if (!this.startedAt) {
      return null;
    }

    // return elapsed time in miliseconds since effect was activated
    return this.paused || (Date.now() - this.startedAt);
  }

  /**
   * Getter for remaining time in miliseconds on this effect
   * @type {number}
   */
  get remaining() {
    return this.config.duration - this.elapsed;
  }

  /**
   * Whether this effect has lapsed
   * @return {boolean}
   */
  isCurrent() {
    return this.elapsed < this.config.duration;
  }

  /**
   * Activate this effect
   * @fires Effect#effectActivated
   */
  activate() {
    // if this effect is already activated, return
    if (this.active) {
      return;
    }

    // set the start time
    this.startedAt = Date.now() - this.elapsed;

    /**
     * @event Effect#effectActivated
     */
    this.emit('effectActivated');

    // activate the effect
    this.active = true;
  }

  /**
   * Deactivate this effect
   * @fires Effect#effectDeactivated
   */
  deactivate() {
    // if this effect is already deactivated, return
    if (!this.active) {
      return;
    }

    /**
     * @event Effect#effectDeactivated
     */
    this.emit('effectDeactivated');

    // deactivate the effect
    this.active = false;
  }

  /**
   * Remove this effect from its target
   * @fires Effect#remove
   */
  remove() {
    /**
     * @event Effect#remove
     */
    this.emit('remove');
  }

  /**
   * Pause this effect
   * @fires Effect#pause
   */
  pause() {
    this.paused = this.elapsed;

    /**
     * @event Effect#pause
     */
    this.emit('pause');
  }

  /**
   * Resume this effect
   * @fires Effect#resume
   */
  resume() {
    this.startedAt = Date.now() - this.paused;
    this.paused = null;

    /**
     * @event Effect#resume
     */
    this.emit('resume');
  }

  /**
   * Modify an attribute or ability on the target character
   * @param {string} attrName or ability
   * @param {number} currentValue
   * @return {number} total of attribute/ability after modified by this effect
   */
  modifyAttribute(attrName, currentValue) {
    let modifier = _ => _;

    // if there's just a function specified, use it for all attributes/abilities
    if (typeof this.modifiers.attributes === 'function') {
      modifier = (current) => {
        return this.modifiers.attributes.bind(this)(attrName, current);
      };
    } else if (attrName in this.modifiers.attributes) {
      // otherwise, map the modifier for each attribute/ability
      modifier = this.modifiers.attributes[attrName];
    }
    return modifier.bind(this)(currentValue);
  }

  /**
   * Modify incoming damage on the target character
   * @param {Damage} damage
   * @param {number} currentAmount
   * @return {Damage}
   */
  modifyIncomingDamage(damage, currentAmount) {
    const modifier = this.modifiers.incomingDamage.bind(this);
    return modifier(damage, currentAmount);
  }

  /**
   * Modify outgoing damage from the target character
   * @param {Damage} damage
   * @param {number} currentAmount
   * @return {Damage}
   */
  modifyOutgoingDamage(damage, currentAmount) {
    const modifier = this.modifiers.outgoingDamage.bind(this);
    return modifier(damage, currentAmount);
  }

  /**
   * Gather data to be persisted
   * @return {Array}
   */
  serialize() {
    let data = {};

    // serialize base config (before being modified below)
    let config = Object.assign({}, this.config);

    // serialize duration for storage, even if infinity
    config.duration = config.duration === Infinity ? 'inf' : config.duration;

    // serialize config's skill
    if (config.skill) {
      config.skill = config.skill.id
    }

    let state = Object.assign({}, this.state);
    // store lastTick as a difference so we can make sure to start where we left off when we hydrate
    if (state.lastTick && isFinite(state.lastTick))  {
      state.lastTick = Date.now() - state.lastTick;
    }

    Object.assign(data, {
      id: this.id,
      config,
      state,
      paused: this.paused,
      startedAt: this.startedAt,
      flags: [] // serialized below
    });

    // TODO: serialize modifiers

    // serialize this effect's flags
    if (this.flags.length) {
      for (const flag of this.flags) {
        data.flags.push(flag.toString());
      }
    }

    return data;
  }

  /**
   * Hydrate the effect with its data
   * @param {GameState} state
   * @param {Object}    data  Object that represents the effect on the character when serialized
   */
  hydrate(state, data) {
    // prepare duration for hydration
    data.config.duration = data.config.duration === 'inf' ? Infinity : data.config.duration;

    // hydrate config
    this.config = data.config;

    // fix elapsed and lastTick, if not numbers
    if (!isNaN(data.elapsed)) {
      this.startedAt = Date.now() - data.elapsed;
    }
    if (!isNaN(data.state.lastTick)) {
      data.state.lastTick = Date.now() - data.state.lastTick;
    }

    // hydrate this effect's state from data
    this.state = data.state;

    this.paused = data.paused;
    this.startedAt = data.startedAt;

    // TODO: hydrate modifiers

    // hydrate this effect's flags
    for (const flag in data.flags) {
      this.flags.push(EffectFlag[flag]);
    }

    // if config has a skill, hydrate it from the game state
    if (data.config.skill) {
      this.skill = state.AbilityManager.get(data.skill) || state.SpellManager.get(data.skill);
    }
  }
}

module.exports = Effect;
