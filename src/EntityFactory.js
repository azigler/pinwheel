'use strict';

const BehaviorManager = require('./BehaviorManager');

/**
 * Stores definitions of entities to allow for easy creation and cloning
 */
class EntityFactory extends Map {
  constructor() {
    super();
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
