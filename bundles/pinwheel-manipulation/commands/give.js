'use strict';

/**
 * Give an item from one character's inventory to another
 * 
 * @param {string}    args       Arguments provided for the command
 * @param {Character} character  Character giving the item
 */
module.exports = (srcPath) => {
  const B = require(srcPath + 'Broadcast');
  const CommandParser = require(srcPath + 'CommandParser');
  const dot = CommandParser.parseDot;
  const ItemUtil = require(srcPath + 'Util/ItemUtil');

  return {
    usage: 'give <item> [to] <target>',
    command: state => (args, character) => {
      args = args.trim();

      // stop if no arguments were provided
      if (!args || !args.length) {
        return B.sayAt(character, 'Give what to whom?');
      }

      // pull the first three arguments (the only ones we're interested in)
      let [ targetItem, to, targetRecip ] = args.split(' ');

      // if the second argument isn't 'to' then assume it's the target
      // (e.g., 'give ball to man')
      if (to !== 'to' || !targetRecip) {
        targetRecip = to;
      }

      // stop if the character is trying to give themselves
      if (targetItem === 'me' || targetItem === 'self') {
        return B.sayAt(character, 'You can\'t give yourself.');
      }

      // determine the item to given
      targetItem = dot(targetItem, character.inventory);

      // stop if the character doesn't have that item
      if (!targetItem) {
        return B.sayAt(character, 'You don\'t have that.');
      }

      // stop if there's no recipient character
      if (!targetRecip) {
        return B.sayAt(character, 'Give that to whom?');
      }

      // stop if the character is targeting themselves as the recipient
      if (targetRecip === 'me' || targetRecip === 'self') {
        return B.sayAt(character, 'You can\'t give something to yourself.');
      }

      // look for a matching player in the room
      // (prioritize looking for players before NPCs)
      let target = dot(targetRecip, character.room.players);

      // if no matching player was found, check NPCs in room
      if (!target) {
        target = dot(targetRecip, character.room.npcs);
        if (target) {
          const accepts = target.getBehavior('accepts');
          // stop unless the NPC is configured to accept that item
          if (!accepts || !accepts.includes(targetItem.entityReference)) {
            return B.sayAt(character, B.capitalize(`${target.name} won't take that.`));
          }
        }
      }

      // stop if there is no recipient character
      if (!target) {
        return B.sayAt(character, 'Give that to whom?');
      }

      // stop if the character is targeting themselves as the recipient
      if (target === character) {
        return B.sayAt(character, 'You can\'t give something to yourself.');
      }

      // stop if the recipient's inventory is full
      if (target.isInventoryFull()) {
        B.sayAt(character, `You try to give ${ItemUtil.display(targetItem)} to <b><white>${target.name}</white></b>, but they can't carry any more.`);
        B.sayAtExcept(character.room, `<b><white>${character.name}</white></b> tries to give ${ItemUtil.display(targetItem)} to <b><white>${target.name}</white></b>, but they can't carry any more.`, [character, target]);
        if (!target.isNpc) {
          B.sayAt(target, B.capitalize(`<b><white>${character.name}</white></b> tries to give ${ItemUtil.display(targetItem)} to you, but you can't carry any more.`));
        }
        return;
      }

      // remove the item from the initial character
      character.removeItem(targetItem);

      // add the item to the recipient character
      target.addItem(targetItem);

      // report success
      B.sayAt(character, `You give ${ItemUtil.display(targetItem)} to <b><white>${target.name}</white></b>.`);
      B.sayAtExcept(character.room, B.capitalize(`<b><white>${character.name}</white></b> gives ${ItemUtil.display(targetItem)} to <b><white>${target.name}</white></b>.`), [character, target]);
      if (!target.isNpc) {
        B.sayAt(target, B.capitalize(`<b><white>${character.name}</white></b> gives ${ItemUtil.display(targetItem)} to you.`));
      }
    }
  };
};
