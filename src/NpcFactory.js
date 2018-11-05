'use strict';

const Npc = require('./Npc');
const EntityFactory = require('./EntityFactory');

/**
 * Store definitions of items to allow for easy creation and cloning
 * 
 * @extends EntityFactory
 */
class NpcFactory extends EntityFactory {
  /**
   * Create a new instance of an NPC by EntityReference. Resulting NPC will
   * _not_ have its contents until it is hydrated.
   * @param {Area}   area
   * @param {string} entityRef
   * @return {Npc}
   */
  create(area, entityRef) {
    const npc = this.createByType(area, entityRef, Npc);
    npc.area = area;
    return npc;
  }
}

module.exports = NpcFactory;
