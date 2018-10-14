'use strict';

const uuid = require('uuid/v4');
const Character = require('./Character');
const Logger = require('./Logger');
const HydrationUtil = require('./Util/HydrationUtil');

/**
 * Representation of a non-player character (NPC)
 * 
 * @property {number} id   Area-relative id (vnum)
 * @property {Area}   area Area npc belongs to (not necessarily the area they're currently in)
 * @property {Map} behaviors
 * @extends Character
 */
class Npc extends Character {
  constructor(area, def) {
    super(def);

    // validate loaded NPC
    const validate = ['id', 'name', 'description'];
    for (const prop of validate) {
      if (!(prop in def)) {
        throw new ReferenceError(`NPC in area [${area.name}] missing required property [${prop}]`);
      }
    }

    // assign required properties
    this.area = area;
    this.id = def.id;

    // default belongings spawned on NPC
    this.defaultBelongings = {
      equipment: def.equipment || [],
      items: def.items || []
    }

    // all NPCs have an entityReference set on their definition via EntityFactory's setDefinition method
    this.entityReference = def.entityReference || 'spawn:99';; 

    // set identifying properties
    this.keywords = def.keywords || this.name.split(' ');
    this.uuid = def.uuid || uuid();

    this.behaviors = new Map(Object.entries(def.behaviors || {}));
    this.script = def.script || '';
    
    // set where the NPC was spawned
    this.source = def.source || null;
    
    // set maximum inventory capacity
    this.maxItems = def.maxItems || 16;

    // TODO: change/remove quests?
    this.quests = def.quests || [];
  }

  /**
   * Whether the NPC has the given keyword
   * @param {string} keyword
   * @return {boolean}
   */
  hasKeyword(keyword) {
    return this.keywords.indexOf(keyword) !== -1;
  }

  /**
   * Whether the NPC has the specified behavior
   * @param {string} name
   * @return {boolean}
   */
  hasBehavior(name) {
    if (!(this.behaviors instanceof Map)) {
        throw new Error("NPC has not been hydrated. Cannot access behaviors.");
    }
    return this.behaviors.has(name);
  }

  /**
   * Return the specified behavior
   * @param {string} name
   * @return {*}
   */
  getBehavior(name) {
    if (!(this.behaviors instanceof Map)) {
        throw new Error("NPC has not been hydrated. Cannot access behaviors.");
    }
    return this.behaviors.get(name);
  }

  /**
   * Move this NPC to the given room, emitting events appropriately
   * @param {Room} nextRoom
   * @param {function} onMoved Function to run after the NPC is moved to the next room but before enter events are fired
   */
  moveTo(nextRoom, onMoved = _ => _) {
    // check if the NPC left the area they were in
    let changedArea = false;
    if (this.room.area.name !== nextRoom.area.name) {
      changedArea = true;
    }

    // if the destination room is not the current room
    if (this.room && this.room !== nextRoom) {
      // announce the NPC's exit from their current room
      this.room.emit('npcLeave', this, nextRoom);

      // emit area departure, if it happened
      if (changedArea) { 
        this.room.area.emit('npcLeave', this, nextRoom);
        this.room.area.removeNpc(this);
      }

      // remove NPC from their current room
      this.room.removeNpc(this);
    }

    this.room = nextRoom;
    nextRoom.addNpc(this);

    // execute given function before events
    onMoved();

    // announce the NPC's entrance to the destination room
    nextRoom.emit('npcEnter', this);

    // emit area arrival, if it happened
    if (changedArea) {
      this.room.area.emit('npcEnter', this);
      nextRoom.area.addNpc(this);
    }

    // move the NPC to the destination room
    this.emit('enterRoom', nextRoom);
  }

  /**
   * Gather data to be persisted
   * @return {Object}
   */
  serialize() {
    let data = super.serialize();

    Object.assign(data, {
      entityReference: this.entityReference,
      keywords: this.keywords,
      uuid: this.uuid,
      script: this.script,
      source: this.source,
      maxItems: this.maxItems,
      quests: this.quests
    });

    // serialize behaviors
    let behaviors = {};
    for (const [key, val] of this.behaviors) {
      // serialize each behavior
      behaviors[key] = val;
    }
    data.behaviors = behaviors;

    return data;
  }

  /**
   * Hydrate the NPC, optionally with data
   * @param {GameState} state
   * @param {Object}    data
   */
  hydrate(state, data = null) {
    super.hydrate(state, data);

    // if data is loaded for hydration
    if (data !== null) {
      this.entityReference = data.entityReference;
      this.keywords = data.keywords;
      this.uuid = data.uuid;
      this.script = data.script;
      this.source = data.source;
      this.maxItems = data.maxItems;
      this.quests = data.quests;

      // if data has behaviors
      if (Object.entries(data.behaviors).length > 0) {
        this.behaviors = new Map(Object.entries(data.behaviors));
      }
    } else {
      // if there's no data to hydrate...
      
      // initialize default inventory
      this.defaultBelongings.items.forEach(defaultItem => {
        // if the item definition is just an entity reference string in an array
        if (typeof defaultItem === 'string') {
          defaultItem = { id: defaultItem };
        }

        const newItem = state.ItemFactory.create(this.area, defaultItem.id);
        Logger.verbose(`\tDIST: Adding item (${newItem.name}) [${defaultItem.id}] to NPC (${this.name}) [${this.entityReference}]`);
        newItem.hydrate(state);
        state.ItemManager.add(newItem);
        this.addItem(newItem);
      });

      // initialize default equipment
      this.defaultBelongings.equipment.forEach(defaultEquipment => {
        // if the equipment definition is just an entity reference string in an array
        if (typeof defaultEquipment === 'string') {
          defaultEquipment = { id: defaultEquipment };
        }

        const newEquipment = state.ItemFactory.create(this.area, defaultEquipment.id);
        Logger.verbose(`\tDIST: Adding equipment (${newEquipment.name}) [${newEquipment.area.name}:${newEquipment.id}] to NPC (${this.name}) [${this.entityReference}]`);
        newEquipment.hydrate(state);
        state.ItemManager.add(newEquipment);
        this.equip(newEquipment, newEquipment.getMeta('slot'));
      });
    }

    // if the NPC has a script
    if (this.script !== '') {
      const scriptPath = `${__dirname + '/'}../bundles/${this.area.bundle}/scripts/npc/${this.script}.js`;
      HydrationUtil.hydrateScript(this, scriptPath);
    }

    // if the NPC has behaviors
    if (this.behaviors.size > 0) {
      for (let [behaviorName, config] of this.behaviors) {
        console.log(behaviorName);
        let behavior = state.NpcBehaviorManager.get(behaviorName);
        if (!behavior) {
          return;
        }

        // behavior may be a boolean in which case it will be `behaviorName: true`
        config = config === true ? {} : config;
        behavior.attach(this, config);
      }
    }
  }

  /**
   * Whether this character is an NPC (true)
   * @return {boolean}
   */
  get isNpc() {
    return true;
  }
}

module.exports = Npc;
