'use strict';

/**
 * Render a list of a character's equipment
 * 
 * @param {string}    args       Arguments provided for the command
 * @param {Character} character  Character checking their equipment
 */
module.exports = (srcPath) => {
  const Broadcast = require(srcPath + 'Broadcast');
  const ItemUtil = require(srcPath + 'Util/ItemUtil');

  return {
    aliases: [ 'worn' ],
    usage: 'equipment',
    command: (state) => (arg, character) => {
      // stop if they have nothing equipped
      if (!character.equipment.size) {
        return Broadcast.sayAt(character, "You have nothing equipped.");
      }

      Broadcast.sayAt(character, "<b><cyan>You have equipped</cyan><yellow>...</b>");
      for (const [slot, item] of character.equipment) {
        Broadcast.sayAt(character, `  <magenta><<b>${slot}</b>></magenta> ${ItemUtil.display(item)}`);
        // render similar text as looking at the item
        Broadcast.sayAt(character, item.description, 60)
        Broadcast.sayAt(character, ItemUtil.renderItem(state, item, character));
      }
    }
  };
};
