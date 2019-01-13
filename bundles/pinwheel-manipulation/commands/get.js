'use strict';

/**
 * Get an item
 * 
 * @param {string}    args       Arguments provided for the command
 * @param {Character} character  Character getting the item
 * @param {string}    arg0       The actual command string supplied, useful when checking which alias was used for a command    
 * @fires Item#get
 * @fires Character#get
 */
module.exports = (srcPath) => {
  const Broadcast = require(srcPath + 'Broadcast');
  const Parser = require(srcPath + 'CommandParser');
  const ItemType = require(srcPath + 'ItemType');
  const ItemUtil = require(srcPath + 'Util/ItemUtil');

  return {
    usage: 'get <item> [container]',
    aliases: [ 'take', 'retrieve', 'loot' ],
    command : (state) => (args, character, arg0) => {
      args = args.trim();
      
      // stop if no argument was provided
      if (!args.length) {
        return Broadcast.sayAt(character, 'Get what?');
      }

      // stop if the character is not in a room
      if (!character.room) {
        return Broadcast.sayAt(character, 'You are unable to get anything here.');
      }

      // stop if the character's inventory is full
      if (character.isInventoryFull()) {
        return Broadcast.sayAt(character, "You can't carry any more items.");
      }

      // 'loot' is an alias for 'get all'
      if (arg0 === 'loot') {
        args = ('all ' + args).trim();
      }

      // strip article (e.g., 'get 2.ball from bag' becomes 'get 2.ball bag')
      let parts = args.split(' ').filter(arg => !arg.match(/from/));

      let source,
      search,
      container = null;

      // if there is only argument (e.g., 'get ball')
      if (parts.length === 1) {
        // set the search target (e.g., 'ball')
        search = parts[0];
        // set from where to retrieve the item 
        source = character.room.items;
      // otherwise, search inside that container (e.g., 'get ball bag' or 'get ball from bag')
      } else {
        // find container in room, inventory, or equipment
        // (newest containers in the room are listed first)
        container = Parser.parseDot(parts[1], [...character.room.items].reverse()) ||
                    Parser.parseDot(parts[1], character.inventory) ||
                    Parser.parseDot(parts[1], character.equipment);

        // stop if there's no matching container
        if (!container) {
          return Broadcast.sayAt(character, "You don't see anything like that here.");
        }

        // stop if there's a matching item but it's not a container
        if (container.type !== ItemType.CONTAINER) {
          return Broadcast.sayAt(character, `${ItemUtil.display(container)} isn't a container.`);
        }

        // stop if the container is closed
        if (container.closed) {
          return Broadcast.sayAt(character, `${ItemUtil.display(container)} is closed.`);
        }

        // set the search target (e.g., 'ball')
        search = parts[0];
        // set from where to retrieve the item (e.g., 'bag')
        source = container.inventory;
      }

      // if the command was 'get all'
      if (search === 'all') {
        // stop if there's no source to retrieve the items from
        // (the source is already set to character.room.items above)
        if (!source || ![...source].length) {
          return Broadcast.sayAt(character, "There isn't anything to take.");
        }

        // attempt to get every item in the retrieval source
        for (let item of source) {
          // account for both Set and Map sources
          if (Array.isArray(item)) {
            item = item[1];
          }

          // stop if the character's inventory is full
          if (character.isInventoryFull()) {
            return Broadcast.sayAt(character, "You can't carry any more items.");
          }

          // get the item
          retrieve(item, character, container);
        }

        return;
      }

      // look for the item at the specified source
      const item = Parser.parseDot(search, source);

      // stop if there's no matching item
      if (!item) {
        return Broadcast.sayAt(character, "You don't see anything like that here.");
      }

      // get the item
      retrieve(item, character, container);
    }
  };

  // helper function for getting an individual item
  function retrieve(item, character, container) {
    // stop if the item has been flagged as irretrievable
    if (item.metadata.noRetrieve) {
      return Broadcast.sayAt(character, `${ItemUtil.display(item)} can't be picked up.`);
    }

    // if a container was supplied, remove the item from there
    if (container) {
      container.removeItem(item);
    // otherwise, assume they're removing the item from the room
    } else {
      character.room.removeItem(item);
    }

    // add the item to the character's inventory
    character.addItem(item);

    // report success
    if (container) {
      Broadcast.sayAt(character, `You get ${ItemUtil.display(item)} from ${ItemUtil.display(container)}.`);
      Broadcast.sayAtExcept(character.room, Broadcast.capitalize(`<b><white>${character.name}</white></b> gets ${ItemUtil.display(item)} from ${ItemUtil.display(container)}.`), [character]);
    } else {
      Broadcast.sayAt(character, `You get ${ItemUtil.display(item)}.`);
      Broadcast.sayAtExcept(character.room, Broadcast.capitalize(`<b><white>${character.name}</white></b> gets ${ItemUtil.display(item)}.`), [character]);
    }

    /**
     * @event Item#get
     */
    item.emit('get', character);

    /**
     * @event Character#get
     */
    character.emit('get', item);
  }
};
