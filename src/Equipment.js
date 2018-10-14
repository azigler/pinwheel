'use strict';

/**
 * Representation of equipment for a `Character`
 * @extends Map
 */
class Equipment extends Map {
  /**
   * Gather data to be persisted
   * @return {Object}
   */
  serialize() {
    const Item = require('./Item');

    let data = {};

    for (const [slot, eq] of this) {
      if (!(eq instanceof Item)) {
        this.delete(slot);
        continue;
      }

      data[slot] = eq.serialize();
    }

    // if no equipment worn, return null
    if (Object.keys(data).length === 0) {
      data = null;
    }

    return data;
  }

  /**
   * Hydrate the equipment for the character
   * @param {GameState} state
   * @param {Character} character
   */
  hydrate(state, character) {
    const Item = require('./Item');

    // for each item in this equipment
    for (const [slot, equipment] of this) {
      // if the equipment has already been initialized
      if (equipment instanceof Item) {
        character.equip(equipment, slot);
        continue;
      }

      // exit if item does not have a valid entity reference
      if (!equipment.entityReference) {
        continue;
      }

      // create and hydrate the equipment
      const area = state.AreaManager.getAreaByReference(equipment.entityReference);
      let newEquipment = state.ItemFactory.create(area, equipment.entityReference);
      newEquipment.uuid = equipment.uuid;
      newEquipment.hydrate(state, equipment);
      character.equip(newEquipment, slot, true);
      this.set(slot, newEquipment);
      state.ItemManager.add(newEquipment);
    }
  }
}

module.exports = Equipment;
