'use strict';

const BehaviorManager = require('./BehaviorManager');

/**
 * Stores definitions of entities to allow for easy creation and cloning
 */
class EntityFactory extends Map {
  constructor() {
    super();
    this.scripts = new BehaviorManager();   // Map of entity scripts for the factory
  }

  /**
   * Create the key used by the factory and scripts Maps
   * @param {string} areaName
   * @param {number} id
   * @return {string}
   */
  createEntityRef(areaName, id) {
    // TODO: extend for player creations
    return areaName + ':' + id;
  }

  /**
   * Get an entity definition from the factory
   * @param {string} entityRef
   * @return {Object}
   */
  getDefinition(entityRef) {
    return this.get(entityRef);
  }

  /**
   * Set an entity definition in the factory
   * @param {string} entityRef
   * @param {Object} def
   */
  setDefinition(entityRef, def) {
    def.entityReference = entityRef;
    this.set(entityRef, def);
  }

  /**
   * Add an event listener from a script to a specific entity
   * @see BehaviorManager::addListener
   * @param {string}   entityRef
   * @param {string}   event
   * @param {Function} listener
   */
  addScriptListener(entityRef, event, listener) {
    this.scripts.addListener(entityRef, event, listener);
  }

  /**
   * Create a new instance of a given entity definition. Resulting entity will 
   * _not_ have its contents until it is hydrated.
   * @param {Area}   area
   * @param {string} entityRef
   * @param {Class}  Type      Type of entity to instantiate
   * @return {type}
   */
  createByType(area, entityRef, Type) {
    const definition = this.getDefinition(entityRef);
    const entity = new Type(area, definition);

    if (this.scripts.has(entityRef)) {
      this.scripts.get(entityRef).attach(entity);
    }

    return entity;
  }

  /**
   * Error catch for invalid create parameters.
   * @return {Error}
   */
  create() {
    throw new Error("No type specified for EntityFactory.create");
  }

  /**
   * Clone an existing entity. Resulting entity will _not_ have its contents
   * until it is hydrated.
   * @param {Item} item
   * @return {Item}
   */
  clone(entity) {
    return this.create(entity.area, entity.entityReference);
  }
  
}

module.exports = EntityFactory;
