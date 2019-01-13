'use strict';

/**
 * Render a list of a character's inventory
 * 
 * @param {string}    args       Arguments provided for the command
 * @param {Character} character  Character checking their inventory
 */
module.exports = (srcPath) => {
  const Broadcast = require(srcPath + 'Broadcast');
  const ItemUtil = require(srcPath + 'Util/ItemUtil');

  return {
    usage: 'inventory',
    command : (state) => (args, character) => {
      // make sure the maximum inventory size has been set
      character._setupInventory()

      // report if the character is carrying nothing
      if (character.inventory === null || character.inventory.size === 0) {
        return Broadcast.sayAt(character, "You aren't carrying anything.");
      }

      Broadcast.at(character, "<b><cyan>You are carrying</cyan><yellow>...</yellow></b>");
      // if there's an inventory capacity, report it
      if (isFinite(character.inventory.getMax())) {
        Broadcast.sayAt(character, ` <magenta>(<b>${character.inventory.size}</b>/<b>${character.inventory.getMax()}</b>)</magenta>`);
      }

      // render a list of the inventory items
      for (const [, item ] of character.inventory) {
        Broadcast.at(character, ' ');
        Broadcast.sayAt(character, `${ItemUtil.display(item)} - ${item.description}`, 60);
        Broadcast.sayAt(character, '');
      }
    }
  };
};
