'use strict';

/**
 * Unequip an item from a character and move it to its inventory
 * 
 * @param {string}    args       Arguments provided for the command
 * @param {Character} character  Character equipping the item
 */
module.exports = (srcPath) => {
  const Broadcast = require(srcPath + 'Broadcast');
  const Parser = require(srcPath + 'CommandParser');
  const ItemUtil = require(srcPath + 'Util/ItemUtil');

  return {
    aliases: [ 'unwield', 'unequip', 'unhold' ],
    usage: 'remove <item>',
    command : state => (arg, character) => {
      arg = arg.trim();

      // stop if no argument was provided
      if (!arg.length) {
        return Broadcast.sayAt(character, 'Remove what?');
      }

      // TODO: account for 'all' as argument

      // determine the item and its slot from the character's equipment
      const result =  Parser.parseDot(arg, character.equipment, true);

      // stop if the character isn't wearing a matching item
      if (!result) {
        return Broadcast.sayAt(character, "You aren't wearing that.");
      }

      // assign the slot and item from the parse
      const [slot, item] = result;

      // unequip the item
      // TIP: this function fires all the needed events
      character.unequip(slot);

      // report success
      Broadcast.sayAt(character, `<b><white>You unequip</white></b> ${ItemUtil.display(item)}<b><white>.</white></b>`);
      Broadcast.sayAtExcept(character.room, Broadcast.capitalize(`${character.name} unequips ${ItemUtil.display(item)}.`), [character]);
    }
  };
};
