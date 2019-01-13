'use strict';

/**
 * Equip an item on a character from its inventory
 * 
 * @param {string}    args       Arguments provided for the command
 * @param {Character} character  Character equipping the item
 * @param {string}    arg0       The actual command string supplied, useful when checking which alias was used for a command
 */
module.exports = (srcPath) => {
  const Broadcast = require(srcPath + 'Broadcast');
  const Parser = require(srcPath + 'CommandParser');
  const { EquipSlotTakenError } = require(srcPath + 'Error/EquipErrors');
  const ItemUtil = require(srcPath + 'Util/ItemUtil');
  const Logger = require(srcPath + 'Logger');
  const say = Broadcast.sayAt;

  return {
    aliases: [ 'wield', 'hold', 'equip', 'eq' ],
    usage: 'wear <item>',
    command : (state) => (arg, character, arg0) => {
      arg = arg.trim();

      // if the original command was 'eq' and no arguments were provided
      if (arg0 === 'eq' && !arg.length) {
        // render the equipment list instead
        return state.CommandManager.get('equipment').execute(null, character);
      }

      // stop if no argument was provided
      if (!arg.length) {
        return say(character, 'Equip what?');
      }

      // TODO: account for 'all' as argument

      // determine the item
      const item = Parser.parseDot(arg, character.inventory);

      // stop if there's no valid item to wear
      if (!item) {
        return say(character, "You aren't carrying that.");
      }

      // stop if the item doesn't have a 'slot' metadata property
      if (!item.metadata.slot) {
        return say(character, `You can't equip ${ItemUtil.display(item)}.`);
      }

      // attempt to equip the item
      try {
        character.equip(item, item.metadata.slot);
      } catch (err) {
        if (err instanceof EquipSlotTakenError) {
          const conflict = character.equipment.get(item.metadata.slot);
          return say(character, `You will have to remove ${ItemUtil.display(conflict)} first.`);
        }

        return Logger.error(err);
      }

      // report success
      Broadcast.sayAt(character, `<b><white>You equip</white></b> ${ItemUtil.display(item)}<b><white>.</white></b>`);
      Broadcast.sayAtExcept(character.room, Broadcast.capitalize(`${character.name} equips ${ItemUtil.display(item)}.`), character);
    }
  };
};
