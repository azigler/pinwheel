'use strict';

const humanize = (sec) => { return require('humanize-duration')(sec, { round: true }); };
const sprintf = require('sprintf-js').sprintf;
const chalk = require('chalk');

/**
 * Look at a room or entity
 * 
 * @param {string}    args       Arguments provided for the command
 * @param {Character} character  Character manipulating the door  
 * @param {string}    arg0       The actual command string supplied, useful when checking which alias was used for a command 
 */
module.exports = (srcPath) => {
  const B = require(srcPath + 'Broadcast');
  const CommandParser = require(srcPath + 'CommandParser');
  const Item = require(srcPath + 'Item');
  const ItemType = require(srcPath + 'ItemType');
  const Logger = require(srcPath + 'Logger');
  const Player = require(srcPath + 'Player');
  const ItemUtil = require(srcPath + 'Util/ItemUtil');

  return {
    usage: "look [target]",
    aliases: ['glance', 'examine'],
    command: state => (args, character, arg0) => {
      // if the character isn't in a room
      if (!character.room) {
        Logger.error(chalk.bold.yellow(`${character.name} tried to look but isn't in a room`));
        return B.sayAt(character, '<b><red>You are not in a room. Please contact a game administrator.</red></b>');
      }

      // if there are arguments, look at what the arguments reference
      if (args) {
        return lookEntity(state, character, args, arg0);
      }

      // otherwise, look at the room
      lookRoom(state, character, arg0);
    }
  };

  // helper function for looking at a room
  function lookRoom(state, character, arg0) {
    const room = character.room;

    // announce the action to the character
    if (arg0 && arg0 === 'examine') {
      B.sayAt(character, `<b><black>You examine your surroundings...</black></b>`);
    } else if (arg0) {
      B.sayAt(character, `<b><black>You ${arg0} around your surroundings...</black></b>`);
    }

    // get minimap compass
    const [ line1, line2, line3 ] = getCompass(character, state);

    // TIP: minimap is 15 characters wide
    // TIP: room title and dash line are formatted to space remaining
    B.sayAt(character, '<cyan><b>' + sprintf('%-62s', room.title) + '</cyan><black>' + line1 + '</b></black>');
    B.sayAt(character, `<b><magenta>${B.line(60)}</magenta></b>` + B.line(2, ' ') + line2);

    // print room description wrapping around the compass
    B.at(character, sprintf('%-60s',room.description.substr(0, 60)) + '  <black><b>' + line3 + '</b></black>');
    if (room.description.length > 60) { B.sayAt(character, room.description.substr(60), 73); }

    // print the room's exits
    B.sayAt(character, '');
    B.at(character, '<black><b>[exits:</black></b> ');

    // find explicitly defined exits
    let foundExits = Array.from(room.exits).map(ex => {
      return [ex.direction, state.RoomManager.getRoom(ex.roomId)];
    });

    // infer directions from coordinates
    if (room.coordinates) {
      const coords = room.coordinates;
      const area = room.area;
      const directions = {
        north: [0, 1, 0],
        south: [0, -1, 0],
        east: [1, 0, 0],
        west: [-1, 0, 0],
        up: [0, 0, 1],
        down: [0, 0, -1],
      };

      foundExits = [...foundExits, ...(Object.entries(directions)
        .map(([dir, diff]) => {
          return [dir, area.getRoomAtCoordinates(coords.x + diff[0], coords.y + diff[1], coords.z + diff[2])];
        })
        .filter(([dir, exitRoom]) => {
          return !!exitRoom;
        })
      )];
    }

    // print list of exits, indicating any doors
    B.at(character, foundExits.map(([dir, exitRoom]) => {
      const door = room.getDoor(exitRoom) || exitRoom.getDoor(room);
      dir = '<b><white>' + dir + '</b></white>';
      if (door && (door.locked || door.closed)) {
        return '<b><magenta>(</magenta></b>' + dir + '<b><magenta>)</magenta></b>';
      }

      return dir;
    }).join(' '));

    // if there are no exits
    if (!foundExits.length) {
      B.at(character, '<b><black>none</black></b>');
    }
    
    // close exit bracket
    B.sayAt(character, '<b><black>]</black></b>');

    // if there are players, list them
    if (room.players.size > 1) {
      B.sayAt(character, '');

      room.players.forEach(otherPlayer => {
        // don't list the player's own name
        if (otherPlayer === character) {
          return;
        }
        // render combat text, if needed
        if (otherPlayer.isInCombat()) {
          let combatantsDisplay = getCombatantsDisplay(otherPlayer);
          B.sayAt(character, `<b><yellow>${otherPlayer.name}</yellow></b>` + ' is here' + combatantsDisplay);
        } else {
          B.sayAt(character, `<b><yellow>${otherPlayer.name}</yellow></b>` + ' is here.');
        }
      });
    }

    // if there are NPCs, list them
    if (room.npcs.size > 1) {
      B.sayAt(character, '');
      
      room.npcs.forEach(npc => {
        // render combat text, if needed
        if (npc.isInCombat()) {
          let combatantsDisplay = getCombatantsDisplay(npc);
          B.sayAt(character, `<b><cyan>${B.capitalize(npc.name)}</cyan></b>` + ' is here' + combatantsDisplay);
        } else {
          B.sayAt(character, `<b><cyan>${B.capitalize(npc.name)}</cyan></b>` + ' is here.');
        }
      });
    }

    // if there are items, list them
    if (room.items.size > 0) {
      B.sayAt(character, '');

      // build a list of colorized item names
      let itemList = [];
      room.items.forEach(item => {
        itemList.push(`${ItemUtil.qualityColorize(item, item.roomDesc)}`);
      });
      
      // render list with correct articles
      if (itemList.length === 2) {
        if (startsWithVowel(itemList[0])) {
          if (startsWithVowel(itemList[1])) {
            B.sayAt(character, `An ${itemList[0]} and an ${itemList[1]} are here.`);
          } else {
            B.sayAt(character, `An ${itemList[0]} and a ${itemList[1]} are here.`);
          }
        } else {
          if (startsWithVowel(itemList[1])) {
            B.sayAt(character, `A ${itemList[0]} and an ${itemList[1]} are here.`);
          } else {
            B.sayAt(character, `A ${itemList[0]} and a ${itemList[1]} are here.`);
          }
        }
      } if (itemList.length === 1) {
        if (startsWithVowel(itemList[0])) {
          B.sayAt(character, `An ${itemList[0]} is here.`);
        } else {
          B.sayAt(character, `A ${itemList[0]} is here.`);
        }
      } if (itemList.length > 2) {
        const lastItem = itemList.pop();
        let printItems;
          if (startsWithVowel(lastItem)) {
            printItems = itemList.join(", ") + ', and an ' + lastItem;
          } else {
            printItems = itemList.join(", ") + ', and a ' + lastItem;
          }
        if (startsWithVowel(itemList[0])) {
          B.sayAt(character, `An ${printItems} are here.`);
        } else {
          B.sayAt(character, `A ${printItems} are here.`);
        }
      }
    }
  }

  // helper function for rendering a minimap from cardinal directions
  function getCompass(character) {
    const room = character.room;

    // define possible cardinal exits for comparison
    const exitMap = new Map();
    exitMap.set('east', 'E');
    exitMap.set('west', 'W');
    exitMap.set('south', 'S');
    exitMap.set('north', 'N');
    exitMap.set('up', 'U');
    exitMap.set('down', 'D');

    // define cardinal direction offsets for coordinates
    const directions = {
      N: [0, 1, 0],
      S: [0, -1, 0],
      E: [1, 0, 0],
      W: [-1, 0, 0],
      U: [0, 0, 1],
      D: [0, 0, -1]
    };

    let directionsAvailable = '';
    const coords = room.coordinates;

    // check each cardinal direction in the room
    if (coords) {
      for (const [dir, diff] of Object.entries(directions)) {
        if (room.area.getRoomAtCoordinates(coords.x + diff[0], coords.y + diff[1], coords.z + diff[2])) {
          directionsAvailable += `${dir}`;
        }
      }
    }

    // build a list of exits by comparing what's in the room to what's possible
    const exits = Array.from(exitMap.values()).map(exit => {
      if (directionsAvailable.includes(exit)) {
        return `<yellow>${exit}</yellow>`;
      }
      // if either SE or NE, pre-pad
      if (exit.length === 2 && exit.includes('E')) {
        return ' -';
      }

      // if either SW or NW, post-pad
      if (exit.length === 2 && exit.includes('W')) {
        return '- ';
      }
      return '-';
    });

    let [E, W, S, N, U, D] = exits;
    U = U === 'U' ? '<yellow><b>U</yellow></b>' : U;
    D = D === 'D' ? '<yellow><b>D</yellow></b>' : D;

    // clean up invalid directions for compass rose
    if (N === '-') {
      N = '^';
    }
    if (S === '-') {
      S = 'v';
    }
    if (E === '-') {
      E = '>';
    }
    if (W === '-') {
      W = '<';
    }

    // build the compass
    const line1 = `    ${N}`;
    const line2 = `<black><b>${W}-${U}(</black><red>@</red><black>)${D}-${E}</b></black>`;
    const line3 = `    ${S}\r\n`;

    return [line1, line2, line3];
  }

  // helper function for listing the combatants of an entity
  function getCombatantsDisplay(entity) {
    const combatantsList = [...entity.combatants.values()].map(combatant => combatant.name);
    if (combatantsList.length === 2) {
      return `, <red>fighting </red>${combatantsList[0]} and ${combatantsList[1]}.`;
    } if (combatantsList.length === 1) {
      return `, <red>fighting </red>${combatantsList[0]}.`;
    } if (combatantsList.length > 2) {
      const finalCombatant = combatantsList.pop();
      return `, <red>fighting </red>${combatantsList.join(", ")}, and ${finalCombatant}.`;
    }
  }

  // helper function to determine if a colorized word starts with a vowel
  function startsWithVowel(word) {
    let result = word.replace(/(<([^>]+)>)/ig,"").charAt(0);
    return ['a', 'e', 'i', 'o', 'u'].indexOf(result.toLowerCase()) !== -1
  }

  // helper function for looking at an entity
  function lookEntity(state, character, args, arg0) {
    const room = character.room;

    args = args.split(' ');
    let search = null;

    // check if the first argument is 'in' or 'at'
    if (args.length > 1) {
      // don't allow 'examine' with a preposition
      if (arg0 === 'examine') {
        return B.sayAt(character, "Huh?");
      }
      search = (args[0] === 'in' || args[0] === 'at') ? args[1] : args[0];
    } else {
      search = args[0];
    }

    // check if they're trying to look at the room
    if (search === 'here' || search === 'room') {
      if (args[0] === 'in') {
        return B.sayAt(character, "Huh?");
      }
      return lookRoom(state, character, arg0);
    }

    // check if the target is the character's own self
    if (search === 'me' || search === 'self' || search === 'myself' || search === character.name.toLowerCase() || search === character.name) {
      B.sayAt(character, "<b><black>You glance at yourself...</black></b>");
      
      // print the character's own description
      B.sayAt(character, character.description, 60);
      B.sayAt(character, '');

      // print a list of the character's own equipment, if they have any
      if (character.equipment.size === 0) {
        B.sayAt(character, "You have nothing equipped.");
      } else {
        for (const [slot, item] of character.equipment) {
          B.sayAt(character, `<magenta><<b>${slot}</b>></magenta> ${ItemUtil.display(item)} - ${item.description}`, 60);
        }
      }
      return;
    }

    // search the character's inventory and equipment before
    // checking the room's players, NPCs, and items to find the target
    let entity = CommandParser.parseDot(search, character.inventory) ||
                 CommandParser.parseDot(search, character.equipment) ||
                 CommandParser.parseDot(search, room.players) ||
                 CommandParser.parseDot(search, room.npcs) ||
                 CommandParser.parseDot(search, room.items)
    
    // check if the given argument is a UUID
    if (search.length === 36) {
      for (let item of room.items) {
        if (item.uuid === search) {
          entity = item;
        }
      }
    }

    // if there's no matching entity
    if (!entity) {
      return B.sayAt(character, "You don't see that here.");
    }

    // if the entity is a player
    if (entity instanceof Player) {
      // announce look
      B.sayAt(character, `You look at <b><white>${entity.name}</white></b>.`);
      B.sayAt(entity, `<b><white>${character.name}</white></b> looks at you.`);
      B.sayAtExcept(character.room, `<b><white>${character.name}</white></b> looks at <b><white>${entity.name}</white></b>.`, [character, entity]);

      // render the player's description
      B.sayAt(character, entity.description, 60);
      B.sayAt(character, '');

      // print a list of the player's equipment, if they have any
      if (entity.equipment.size === 0) {
        B.sayAt(character, "<b><black>They have nothing equipped.</black></b>");
      } else {
        for (const [slot, item] of entity.equipment) {
          B.sayAt(character, `<magenta><<b>${slot}</b>></magenta> ${ItemUtil.display(item)} - ${item.description}`, 60);
        }
      }
      return;
    }

    // if the entity is an item
    if (entity instanceof Item) {
      B.sayAt(character, entity.description, 60);
      
      switch (entity.type) {
        case ItemType.WEAPON:
        case ItemType.WEARABLE:
        case ItemType.OBJECT:
          B.sayAt(character, ItemUtil.renderItem(state, entity, character));
          break;
        case ItemType.CONTAINER: {
          // don't render the item display box for a corpse
          if (entity.entityReference !== 'start:corpse') {
            B.at(character, ItemUtil.renderItem(state, entity, character));
          }
          if (!entity.inventory || !entity.inventory.size) {
            return B.sayAt(character, ` It is empty.`);
          }

          if (entity.closed) {
            return B.sayAt(character, ` It is closed.`);
          }

          B.at(character, ' <b><cyan>Contents</cyan><yellow>...</yellow></b> ');
          if (isFinite(entity.inventory.getMax())) {
            let maxString = `<magenta>/<b>${entity.inventory.getMax()}</b></magenta>`;
            if (entity.inventory.getMax() === null) {
              maxString = '';
            }
            B.sayAt(character, `<magenta>(<b>${entity.inventory.size}</b></magenta>${maxString}<magenta>)</magenta>`);
          }

          for (const [, item ] of entity.inventory) {
            B.at(character, ' ');
            B.sayAt(character, '  ' + ItemUtil.display(item) + ' - ' + item.description, 60);
          }
          break;
        }
      }
    }
  }
};
