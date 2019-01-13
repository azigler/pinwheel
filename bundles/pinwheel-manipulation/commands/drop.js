'use strict';

/**
 * Drop an item
 * 
 * @param {string}    args       Arguments provided for the command
 * @param {Character} character  Character dropping the item
 * @fires Character#drop
 * @fires Item#drop
 * @fires Npc#dropItem
 */
module.exports = (srcPath) => {
  const Broadcast = require(srcPath + 'Broadcast');
  const Parser = require(srcPath + 'CommandParser');
  const ItemUtil = require(srcPath + 'Util/ItemUtil');

  return {
    usage: 'drop <item>',
    command: (state) => (args, character) => {
      args = args.trim();

      // stop if no argument was provided
      if (!args.length) {
        return Broadcast.sayAt(character, 'Drop what?');
      }

      // stop if the character is not in a room
      if (!character.room) {
        return Broadcast.sayAt(character, 'You are unable to drop anything here.');
      }

      // if character sent "drop all"
      if (args === 'all') {
        // if they have items, drop them
        if (character.inventory !== null && character.inventory.size > 0) {
          character.inventory.forEach(function(value, key, map) {
            dropItem(value, character);
          });
        // otherwise, report there's nothing to drop
        } else {
          return Broadcast.sayAt(character, "You aren't carrying anything.");
        }
      // otherwise, if they didn't send "drop all"
      } else {
        // determine the item to drop
        const item = Parser.parseDot(args, character.inventory);
        dropItem(item, character);
      }

      // helper function for dropping an individual item
      function dropItem(item, character) {
        // stop if no matching item was found
        if (!item) {
          return Broadcast.sayAt(character, "You aren't carrying that.");
        }

        // remove the item from the character's inventory and add it to the room
        character.removeItem(item);
        character.room.addItem(item);

        /**
         * @event Character#drop
         */
        character.emit('drop', item);
        
        /**
         * @event Item#drop
         */
        item.emit('drop', character);

        // notify all NPCs in the room
        for (const npc of character.room.npcs) {
          /**
           * @event Npc#dropItem
           */
          npc.emit('dropItem', character, item);
        }

        // report success
        Broadcast.sayAt(character, `You drop ${ItemUtil.display(item)}<b><white>.</white></b>`);
        Broadcast.sayAtExcept(character.room, `<b><white>${character.name}</white></b> drops ${ItemUtil.display(item)}.`, [character]);
      }
    }
  };
};
