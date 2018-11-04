'use strict';

const Attributes = require('./Attributes');
const EffectList = require('./EffectList');
const EquipSlotTakenError = require('./Error/EquipErrors').EquipSlotTakenError;
const EventEmitter = require('events');
const Metadatable = require('./Metadatable');
const Equipment = require('./Equipment');
const Inventory = require('./Inventory');
const InventoryErrors = require('./Error/InventoryErrors');
const Config = require('./Config');

/**
 * Representation of a character, the base entity for both NPCs and players
 *
 * @property {string}     name        Name of character
 * @property {string}     description Text shown when looked at
 * @property {Inventory}  inventory   Inventory of character
 * @property {Equipment}  equipment   Equipment of character
 * @property {Set}        combatants  Set of entities this character is currently fighting
 * @property {object}     combatData  Combat metadata for this character
 * @property {Species}    species     Species for this character
 * @property {Array|String} archetype Archetype (or array of Archetypes) for this character
 * @property {Attributes} attributes  Attributes of character
 * @property {Attributes} skills      Skills of character, represented like attributes
 * @property {Array|String} traits    Trait (or array of this Traits) for this character
 * @property {Set}        followers   Set of this character's followers
 * @property {Character}  following   Entity that this character is following 
 * @property {Party}      party       This character's party 
 * @property {EffectList} effects     List of current effects applied to the character
 *
 * @implements {Broadcastable}
 * @extends EventEmitter
 * @mixes Metadatable
 */
class Character extends Metadatable(EventEmitter) {
  constructor(def) {
    super();

    // assign required properties
    this.name = def.name;
    this.description = def.description;

    // initialize inventory and equipment
    this.inventory = null;
    this.equipment = new Equipment();

    // initialize combat properties
    this.combatants = new Set();
    this.combatData = {};

    // initialize profile
    this.species = def.species || 'human';
    this.archetype = def.archetype || 'townie';

    // assign attributes, skills, and traits
    this.attributes = def.attributes || null;
    this.skills = def.skills || null;
    this.traits = def.traits || null;

    // initialize party properties
    this.followers = new Set();
    this.following = def.following || null;
    this.party = null;

    // initialize effects
    this.effects = new EffectList(this, def.effects);

    // arbitrary data storage
    // WARNING: values must be JSON.stringify-able
    this.metadata = def.metadata || {};
  }

  /**
   * Create an Inventory object from a serialized inventory
   * @param {Array} items Serialized inventory
   * @param {number} maxItems Maximum number of items this inventory can hold
   */
  initializeInventory(items, maxItems) {
    if (items !== undefined) {
      this.inventory = new Inventory(items, maxItems);
    } else {
      this.inventory = null;
    }
  }

  /**
   * Set up inventory, if not already initialized
   * @private
   */
  _setupInventory() {
    if (!this.inventory) {
      this.inventory = new Inventory([], this.maxItems);
    }
    if (!this.isNpc) {
      this.inventory.setMax(Config.get('defaultMaxPlayerInventory') || 20);
    }
  }

  /**
   * Whether this item's inventory is full
   * @return {boolean}
   */
  isInventoryFull() {
    this._setupInventory();
    return this.inventory.isFull;
  }

  /**
   * Add an item to this character's inventory
   * @param {Item} item
   */
  addItem(item) {
    this._setupInventory();
    item.belongsTo = this;
    this.inventory.addItem(item);
  }

  /**
   * Remove an item from this character's inventory
   * @param {Item} item
   */
  removeItem(item) {
    this.inventory.removeItem(item);
    item.belongsTo = null;
  }

  /**
   * Check if this character has a particular item by entity reference
   * and return that item, if found
   * @param {string} itemReference
   * @return {Item|boolean}
   */
  hasItem(itemReference) {
    for (const [ uuid, item ] of this.inventory) {
      if (item.entityReference === itemReference) {
        return item;
      }
    }

    return false;
  }

  /**
   * Equip an item in a given slot from the character's inventory
   * @param {Item}    item
   * @param {string}  slot
   * @param {Boolean} hydration whether this is being called during hydration
   *
   * @throws EquipSlotTakenError
   */
  equip(item, slot, hydration = false) {
    if (this.equipment.has(slot) && hydration === false) {
      throw new EquipSlotTakenError();
    }
    
    if (this.inventory) {
      this.removeItem(item);
    }

    this.equipment.set(slot, item);
    item.isEquipped = true;
    item.belongsTo = this;
    item.emit('equip', this);
    this.emit('equip', slot, item);
  }

  /**
   * Unequip an item from a given slot and move it to the character's inventory
   * @param {string} slot
   *
   * @throws InventoryFullError
   */
  unequip(slot) {
    if (this.isInventoryFull()) {
      throw new InventoryErrors.InventoryFullError();
    }

    const item = this.equipment.get(slot);
    item.isEquipped = false;
    this.equipment.delete(slot);
    item.emit('unequip', this);
    this.emit('unequip', slot, item);
    this.addItem(item);
  }

  /**
   * Proxy all events on the player to effects
   * @param {string} event
   * @param {...*}   args
   */
  emit(event, ...args) {
    super.emit(event, ...args);

    this.effects.emit(event, ...args);
  }

  /**
   * Whether this character has the specified attribute or skill
   * @param {string} attr Attribute or skill name
   * @return {boolean}
   */
  hasAttribute(attr) {
    const attrs = new Map([...this.attributes, ...this.skills]);
    return attrs.has(attr);
  }

  /**
   * Get the current value of an attribute or skill (base modified by delta)
   * @param {string} attr
   * @return {number}
  */
  getAttribute(attr) {
    if (this.hasAttribute(attr)) {
      const attrs = new Map([...this.attributes, ...this.skills]);
      return this.getMaxAttribute(attr) + attrs.get(attr).delta;
    }
    return 0;
  }

  /**
   * Get the current maximum value of an attribute or skill (modified by effects)
   * @param {string} attr Attribute or skill name
   * @return {number}
   */
  getMaxAttribute(attr) {
    if (this.hasAttribute(attr)) {
      const attrs = new Map([...this.attributes, ...this.skills]);
      const attribute = attrs.get(attr);
      return this.effects.evaluateAttribute(attribute);
    }
    return 0;
  }

  /**
   * Get the base value for a given attribute or skill
   * @param {string} attr Attribute or skill name
   * @return {number}
   */
  getAttributeBase(attr) {
    const attrs = new Map([...this.attributes, ...this.skills]);
    var attr = attrs.get(attr);
    return attr && attr.base;
  }

  /**
   * Update an attribute's base value
   *
   * TIP: You _probably_ don't want to use this the way you think you do. You should not use this
   * for any temporary modifications to an attribute, instead you should use an Effect modifier.
   *
   * WARNING: This will _permanently_ update the base value for an attribute to be used for things
   * like a player purchasing a permanent upgrade.
   *
   * @param {string} attr Attribute or skill name
   * @param {number} newBase New base value
   */
  setAttributeBase(attr, newBase) {
    if (this.attributes.has(attr)) {
      this.attributes.get(attr).setBase(newBase);
    }
    if (this.skills.has(attr)) {
      this.skills.get(attr).setBase(newBase);
    }
    this.emit('attributeUpdate', attr, this.getAttribute(attr));
  }

  /**
   * Add an attribute to this character
   * @param {string} name
   * @param {number} base
   * @param {?number} delta
   * @see {@link Attributes#add}
   */
  addAttribute(name, base = 0, delta = 0) {
    if (!this.hasAttribute(name)) {
      this.attributes.add(name, base, delta);
    }
  }

  /**
   * Add a skill to this character
   * @param {string} name
   * @param {number} base
   * @param {?number} delta
   * @see {@link Attributes#add}
   */
  addSkill(name, base = 0, delta = 0) {
    if (!this.hasAttribute(name)) {
      this.skills.add(name, base, delta);
    }
  }

  /**
   * Clears any changes to the attribute or skill, setting it to its base value.
   * @param {string} attr Attribute or skill name
  */
  setAttributeToMax(attr) {
    if (this.attributes.has(attr)) {
      this.attributes.get(attr).setDelta(0);
    }
    if (this.skills.has(attr)) {
      this.skills.get(attr).setDelta(0);
    }
    this.emit('attributeUpdate', attr, this.getAttribute(attr));
  }

  /**
   * Raise an attribute or skill by a specified amount
   * @param {string} attr Attribute or skill name
   * @param {number} amount
   * @see {@link Attributes#raise}
  */
  raiseAttribute(attr, amount) {
    if (this.attributes.has(attr)) {
      this.attributes.get(attr).raise(amount);
    }
    if (this.skills.has(attr)) {
      this.skills.get(attr).raise(amount);
    }
    this.emit('attributeUpdate', attr, this.getAttribute(attr));
  }

  /**
   * Lower an attribute or skill by an amount
   * @param {string} attr Attribute or skill
   * @param {number} amount
   * @see {@link Attributes#lower}
  */
  lowerAttribute(attr, amount) {
    if (this.attributes.has(attr)) {
      this.attributes.get(attr).lower(amount);
    }
    if (this.skills.has(attr)) {
      this.skills.get(attr).lower(amount);
    }
    this.emit('attributeUpdate', attr, this.getAttribute(attr));
  }

  /**
   * Whether this character has the specified effect
   * @param {string} type
   * @return {boolean}
   * @see {@link Effect}
   */
  hasEffectType(type) {
    return this.effects.hasEffectType(type);
  }

  /**
   * Add an effect to this character
   * @param {Effect} effect
   * @return {boolean}
   */
  addEffect(effect) {
    return this.effects.add(effect);
  }

  /**
   * Remove an effect from this character
   * @param {Effect} effect
   * @see {@link Effect#remove}
   */
  removeEffect(effect) {
    this.effects.remove(effect);
  }

  /**
   * Start combat with a given target
   * @param {Character} target
   * @param {?number}   lag    Optional milliseconds of lag to apply before the first attack
   */
  initiateCombat(target, lag = 0) {
    // if this character is not in combat, start combat
    if (!this.isInCombat()) {
      this.combatData.lag = lag;
      this.combatData.roundStarted = Date.now();
      this.emit('combatStart');
    }

    // if this character is already fighting the target, return
    if (this.isInCombat(target)) {
      return;
    }

    // add the target to this character's combatant list, and
    // start set up combat for the target
    this.combatants.add(target);
    // if the target is not in combat, start combat for them
    if (!target.isInCombat()) {
      // TIP: this doesn't use `addCombatant` because `addCombatant` automatically
      // adds this character to the target's combatants list, and that will already
      // happen when the target fires initiateCombat (see just above this code block)
      target.initiateCombat(this, 2500 - ((target.getAttribute('reflexes')) * 20));
    } else {
      // otherwise, add this character to the target's combatant list
      target.addCombatant(this);
    }
    this.emit('combatantAdded', target);
  }

  /**
   * If a target is given, check whether this character is in combat with them
   * If no target is given, check whether this character is in combat with anyone
   * @param {?Character} target
   * @return boolean
   */
  isInCombat(target) {
    return target ? this.combatants.has(target) : this.combatants.size > 0;
  }

  /**
   * Add the target character to this character's combatant list
   * @param {Character} target
   */
  addCombatant(target) {
    if (this.isInCombat(target)) {
      return;
    }

    this.combatants.add(target);
    target.addCombatant(this);
  }

  /**
   * Remove the target character from this character's combatant list
   * @param {Character} target
   */
  removeCombatant(target) {
    if (!this.combatants.has(target)) {
      return;
    }

    this.combatants.delete(target);
    this.emit('combatantRemoved');

    // if that was the last combatant, end combat
    if (!this.combatants.size) {
      this.emit('combatEnd');
    }

    // do the same for the target character (removing from combat is mutual)
    target.removeCombatant(this);
  }

  /**
   * Fully remove this character from combat
   */
  removeFromCombat() {
    if (!this.isInCombat()) {
      return;
    }

    for (const combatant of this.combatants) {
      this.removeCombatant(combatant);
    }

    this.combatData = {};
  }

  /**
   * Evaluate this character's incoming damage with its active effects
   * @see EffectList.evaluateIncomingDamage
   * @param {Damage} damage
   * @return {number}
   */
  evaluateIncomingDamage(damage, currentAmount) {
    let amount = this.effects.evaluateIncomingDamage(damage, currentAmount);
    return Math.floor(amount);
  }

  /**
   * Evaluate this character's outgoing damage with its active effects
   * @see EffectList.evaluateOutgoingDamage
   * @param {Damage} damage
   * @param {number} currentAmount
   * @return {number}
   */
  evaluateOutgoingDamage(damage, currentAmount) {
    return this.effects.evaluateOutgoingDamage(damage, currentAmount);
  }

  /**
   * Begin following another character.
   * TIP: a character following itself is the same as unfollowing
   * @param {Character} target
   */
  follow(target) {
    if (target === this) {
      this.unfollow();
      return;
    }

    this.following = target;
    target.addFollower(this);
  }

  /**
   * Stop following whoever this character is following
   */
  unfollow() {
    if (this.following !== null) {
      this.following.removeFollower(this);
      this.following = null;
    }
  }

  /**
   * Add the target character to this character's followers
   * @param {Character} follower
   */
  addFollower(target) {
    this.followers.add(target);
    target.following = this;
  }

  /**
   * Remove the target character from this character's followers
   * @param {Character} target
   */
  removeFollower(target) {
    this.followers.delete(target);
    target.following = null;
  }

  /**
   * Whether this character is following the target character
   * @param {Character} target
   * @return {boolean}
   */
  isFollowing(target) {
    return this.following === target;
  }

  /**
   * Whether the target character is following this character
   * @param {Character} target
   * @return {boolean}
   */
  hasFollower(target) {
    return this.followers.has(target);
  }

  /**
   * Whether the character can leave the current room to a given direction
   * @param {string} direction
   * @return {boolean}
   */
  canGo(direction) {
    // if the character is not in a room
    if (!this.room) {
      return false;
    }

    const exits = Array.from(this.room.exits).filter(e => e.direction.indexOf(direction) === 0);

    // if there are no exits in the current room
    if (!exits.length) {
      return false;
    }

    // if there is more than one exit in the given direction
    if (exits.length > 1) {
      return false;
    }

    // if the character is in combat
    if (this.isInCombat()) {
      return false;
    }

    return true;
  }

  /**
   * Gather data to be persisted
   * @return {Object}
   */
  serialize() {
    let data = {};

    Object.assign(data, {
      name: this.name,
      description: this.description,
      inventory: this.inventory && this.inventory.serialize(),
      species: this.species,
      archetype: this.archetype,
      traits: this.traits,
      attributes: this.attributes.serialize(),
      skills: this.skills.serialize(),
      effects: this.effects.serialize(),
      metadata: this.metadata
    });

    // serialize equipment
    if (this.equipment.size > 0) {
      data.equipment = this.equipment.serialize();
    } else {
      data.equipment = null;
    }

    // serialize combatants
    if (this.combatants instanceof Set) {
      let combatants = [];
      for (let combatant of this.combatants) {
        if (combatant.isNpc) {
          combatants.push(combatant.uuid);
        } else {
          combatants.push(combatant.name);
        }
      }
      data.combatants = combatants;
    } else {
      data.combatants = null;
    }

    // serialize a reference for whom this character is following
    if (this.following === null || !this.following) {
      data.following = null;
    }
    else if (this.following.isNpc && this.following !== null) {
      data.following = this.following.uuid;
    }
    else if (!this.following.isNpc && this.following !== null) {
      data.following = this.following.name;
    }

    // serialize followers
    if (this.followers instanceof Set) {
      let followers = [];
      for (let follower of this.followers) {
        if (follower.isNpc) {
          followers.push(follower.uuid);
        } else {
          followers.push(follower.name);
        }
      }
      data.followers = followers;
    } else {
      data.followers = null;
    }

    return data;
  }

  /**
   * Hydrate the character, optionally with data
   * @param {GameState} state
   * @param {Object}    data
   */
  hydrate(state, data = null) {
    // hydrate effects
    this.effects.hydrate(state);

    // if data is loaded for hydration
    if (data !== null) {
      this.name = data.name;
      this.description = data.description;
      this.metadata = data.metadata;
      this.attributes = new Attributes(data.attributes);
      this.skills = new Attributes(data.skills);
      this.species = data.species;
      this.archetype = data.archetype;
      this.traits = data.traits;

      // if data has an inventory
      if (data.inventory && data.inventory.items.length > 0) {
        this.initializeInventory(data.inventory.items, this.maxItems);
        this.inventory.forEach(item => {
          this.addItem(item);
        });
        this.inventory.hydrate(state, this);
      }

      // if data has equipment
      if (data.equipment !== null) {
        this.equipment = new Equipment(Object.entries(data.equipment));
        this.equipment.hydrate(state, this);
      }

      // if data has active combatants (is in combat)
      for (const combatant of data.combatants) {
        if (state.PlayerManager.getPlayer(combatant)) {
          this.initiateCombat(state.PlayerManager.getPlayer(combatant));
        }
        if (state.NpcManager.get(combatant)) {
          this.initiateCombat(state.NpcManager.get(combatant));
        }
      }
      // if no data was loaded and this character is fresh
    } else {
      // stash attributes and skills from definition, to use later
      const tempAttrs = this.attributes;
      const tempSkills = this.skills;

      // initialize attributes and skills
      this.attributes = new Attributes();
      this.skills = new Attributes();

      // apply attributes and skills from character's species
      this.species = state.SpeciesManager.setupSpecies(this, state);

      // apply attributes and skills from character's archetype(s)
      const arch = [];
      for (const archetype of [this.archetype]) {
        arch.push(state.ArchetypeManager.setupArchetype(this, state, archetype));
      }
      this.archetype = arch;

      // apply attributes and skills from character's traits
      if (this.traits !== null) {
        const ts = [];
        for (const trait of [this.traits]) {
          ts.push(state.TraitManager.setupTrait(this, state, trait));
        }
        this.traits = ts;
      }

      // now use the attributes and skills from definition to alter final stats
      for (const attr in tempAttrs) {
        const current = this.getAttribute(attr);
        const val = tempAttrs[attr];
        this.setAttributeBase(attr, current + val);
      }
      for (const skill in tempSkills) {
        const current = this.getAttribute(skill);
        const val = tempSkills[skill];
        this.setAttributeBase(skill, current + val);
      }
    }

    // apply listeners from character's species
    state.SpeciesManager.attachListeners(state, this);

    // apply listeners from character's archetype(s)
    for (const archetype of this.archetype) {
      state.ArchetypeManager.attachListeners(state, this, archetype);
    }

    // apply listeners from character's traits
    if (this.traits !== null) {
      for (const trait of this.traits) {
        state.TraitManager.attachListeners(state, this, trait);
      }
    }

    // if following another character
    if (this.following !== null) {
      if (state.PlayerManager.getPlayer(this.following)) {
        this.follow(state.PlayerManager.getPlayer(this.following));
      }
      if (state.NpcManager.get(this.following)) {
        this.follow(state.NpcManager.get(this.following));
      }
    }
  }

  /**
   * Used by Broadcast
   * @see {@link Broadcastable}
   * @see {@link Broadcast}
   */
  getBroadcastTargets() {
    return [];
  }

  /**
   * Whether this character is an NPC (defaults to false)
   * @return {boolean}
   */
  get isNpc() {
    return false;
  }
}

module.exports = Character;
