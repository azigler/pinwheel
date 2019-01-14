'use strict';

/**
 * Open, close, lock, or unlock a door or item
 * 
 * @param {string}    args       Arguments provided for the command
 * @param {Character} character  Character manipulating the door
 * @param {string}    arg0       The actual command string supplied, useful when checking which alias was used for a command    
 */
module.exports = (srcPath) => {
  const B = require(srcPath + 'Broadcast');
  const Parser = require(srcPath + 'CommandParser');
  const ItemUtil = require(srcPath + 'Util/ItemUtil');
  const ItemType = require(srcPath + 'ItemType');

  return {
    aliases: ['close', 'lock', 'unlock'],
    usage: '[open/close/lock/unlock] <door direction> / [open/close/lock/unlock] <item>',
    command: state => (args, character, arg0) => {
      args = args.trim();

      // determine the actual command
      const action = arg0.toString().toLowerCase();

      // stop if no argument was provided
      if (!args || !args.length) {
        return B.sayAt(character, `What do you want to ${action}?`);
      }

      // stop if the character isn't in a room
      if (!character.room) {
        return B.sayAt(character, 'You can\'t do that here.');
      }

      // split provided arguments
      const parts = args.split(' ');

      // assume the first argument is a direction
      let exitDirection = parts[0];
      // if first argument is the word 'door'
      if (parts[0] === 'door' && parts.length >= 2) {
        // assume the second argument is a direction
        exitDirection = parts[1];
      }

      let validTarget = false;
      let doorRoom = character.room;
      let door = null;
      let targetRoom = null;
      let exit = null;

      // define cardinal directions and their offsets
      const directionOffsets = {
        north: [0, 1, 0],
        south: [0, -1, 0],
        east: [1, 0, 0],
        west: [-1, 0, 0],
        up: [0, 0, 1],
        down: [0, 0, -1],
      };

      // define directions and their shortcuts
      const inputDirections = {
        'north':  'north',
        'east':  'east',
        'south':  'south',
        'west':  'west',
        'up':  'up',
        'down':  'down',
        'n':  'north',
        'e':  'east',
        's':  'south',
        'w':  'west',
        'u':  'up',
        'd':  'down',
      };

      // first check defined, non-cardinal exits in the room
      for (const ex of character.room.exits) {
        if (ex.direction === exitDirection) {
          exitDirection = ex.direction;
          exit = state.RoomManager.findExit(character.room, exitDirection);

          targetRoom = state.RoomManager.getRoom(exit.roomId);
          door = doorRoom.getDoor(targetRoom);

          // if the door isn't in this room
          if (!door) {
            doorRoom = targetRoom;
            targetRoom = character.room;
            // check if the door is in the other room
            door = doorRoom.getDoor(targetRoom);
          }
        }
      }

      // if no defined exits were found, check cardinal directions
      if (!validTarget) {
        for (const [short, full] of Object.entries(inputDirections)) {
          if (exitDirection === short || exitDirection === full) {
            exit = state.RoomManager.findExit(character.room, full);
            if (!exit) {
              const coords = character.room.coordinates;
              targetRoom = character.room.area.getRoomAtCoordinates(coords.x + directionOffsets[full][0], coords.y + directionOffsets[full][1], coords.z + directionOffsets[full][2]);
              exit = {
                roomId: targetRoom.entityReference,
                direction: full
              }
            }

            targetRoom = state.RoomManager.getRoom(exit.roomId);
            door = doorRoom.getDoor(targetRoom);

            if (!door) {
              doorRoom = targetRoom;
              targetRoom = character.room;
              // check if the door is in the other room
              door = doorRoom.getDoor(targetRoom);
            }
          }
        }
      }
        
        // if we found a door, assume we're using the command on it
      if (door) {
        validTarget = true;
        const characterKey = character.hasItem(door.lockedBy);
        switch (action) {
          // if the character is trying to open
          case 'open': {
            if (door.locked) {
              if (door.lockedBy) {
                if (characterKey) {
                  B.sayAt(character, `You unlock the ${exit.direction} exit with ${ItemUtil.display(characterKey)} and open it.`);
                  B.sayAtExcept(character.room, `<b><white>${character.name}</white></b> unlocks the ${exit.direction} exit with ${ItemUtil.display(characterKey)} and opens it.`, [character]);
                  doorRoom.unlockDoor(targetRoom);
                  return doorRoom.openDoor(targetRoom);
                }
              }
              B.sayAtExcept(character.room, `<b><white>${character.name}</white></b> tries to open the ${exit.direction} exit in vain.`, [character]);
              return B.sayAt(character, `You try to open the ${exit.direction} exit in vain.`);
            }
            if (door.closed) {
              B.sayAt(character, `You open the ${exit.direction} exit.`);
              B.sayAtExcept(character.room, `<b><white>${character.name}</white></b> opens the ${exit.direction} exit.`, [character]);
              return doorRoom.openDoor(targetRoom);
            } else {
              return B.sayAt(character, `The ${exit.direction} exit is not closed.`);
            }
          }
          // if the character is trying to close
          case 'close': {
            if (door.locked || door.closed) {
              return B.sayAt(character, `The ${exit.direction} exit is already closed.`);
            }
            B.sayAt(character, `You close the ${exit.direction} exit.`);
            B.sayAtExcept(character.room, `<b><white>${character.name}</white></b> closes the ${exit.direction} exit.`, [character]);
            return doorRoom.closeDoor(targetRoom);
          }
          // if the character is trying to lock
          case 'lock': {
            if (door.locked) {
              return B.sayAt(character, `The ${exit.direction} exit is already locked.`);
            }
            if (!characterKey) {
              return B.sayAt(character, `You don't have the key to lock the ${exit.direction} exit.`);
            }
            if (door.closed) {
              B.sayAt(character, `You lock the ${exit.direction} exit with ${ItemUtil.display(characterKey)}.`);
              B.sayAtExcept(character.room, `<b><white>${character.name}</white></b> locks the ${exit.direction} exit with ${ItemUtil.display(characterKey)}.`, [character]);
            } else {
              B.sayAt(character, `You close and lock the ${exit.direction} exit with ${ItemUtil.display(characterKey)}.`);
              B.sayAtExcept(character.room, `<b><white>${character.name}</white></b> closes and locks the ${exit.direction} exit with ${ItemUtil.display(characterKey)}.`, [character]);
            }
            return doorRoom.lockDoor(targetRoom);
          }
          // if the character is trying to unlock
          case 'unlock': {
            if (door.locked) {
              if (!characterKey) {
                return B.sayAt(character, `You don't have the key to unlock the ${exit.direction} exit.`);
              } else {
                B.sayAt(character, `You unlock the ${exit.direction} exit with ${ItemUtil.display(characterKey)}.`);
                B.sayAtExcept(character.room, `<b><white>${character.name}</white></b> unlocks the ${exit.direction} exit with ${ItemUtil.display(characterKey)}.`, [character]);
                return doorRoom.unlockDoor(targetRoom);
              }
            }
            if (door.closed) {
              return B.sayAt(character, `The ${exit.direction} exit is already unlocked.`);
            } else {
              return B.sayAt(character, `The ${exit.direction} exit is already open.`);
            }
          }
        }
      }

      // otherwise, assume the character is targeting an item
      let item = Parser.parseDot(args, character.inventory) || 
                 Parser.parseDot(args, character.equipment) ||
                 Parser.parseDot(args, character.room.items);

      // if a matching item was found
      if (item) {
        validTarget = true;
        const characterKey = character.hasItem(item.lockedBy);
        if (item.type === ItemType.CONTAINER) {
          switch (action) {
            // if the character is trying to open
            case 'open': {
              if (item.locked) {
                if (item.lockedBy) {
                  if (characterKey) {
                    B.sayAt(character, `You unlock ${ItemUtil.display(item)} with ${ItemUtil.display(characterKey)} and open it.`);
                    item.unlock();
                    item.open();
                    return;
                  }
                }
                B.sayAtExcept(character.room, `<b><white>${character.name}</white></b> tries to open ${ItemUtil.display(item)} in vain.`, [character]);
                return B.sayAt(character, `You try to open ${ItemUtil.display(item)} in vain.`);
              }
              if (item.closed) {
                B.sayAt(character, `You open ${ItemUtil.display(item)}.`);
                B.sayAtExcept(character.room, `<b><white>${character.name}</white></b> opens ${ItemUtil.display(item)}.`, [character]);
                return item.open();
              }
              return B.sayAt(character, `${ItemUtil.display(item)} isn't closed.`);
            }
            // if the character is trying to close
            case 'close': {
              if (item.locked || item.closed) {
                return B.sayAt(character, "It's already closed.");
              } if (item.closeable) {
                B.sayAt(character, `You close ${ItemUtil.display(item)}.`);
                B.sayAtExcept(character.room, `<b><white>${character.name}</white></b> closes the ${ItemUtil.display(item)}.`, [character]);
                return item.close();
              }
            }
            // if the character is trying to lock
            case 'lock': {
              if (item.locked) {
                return B.sayAt(character, "It's already locked.");
              }
              if (!characterKey) {
                return B.sayAt(character, `You don't have the key to lock ${ItemUtil.display(item)}.`);
              }
              if (item.closed) {
                B.sayAt(character, `You lock ${ItemUtil.display(item)} with ${ItemUtil.display(characterKey)}.`);
                B.sayAtExcept(character.room, `<b><white>${character.name}</white></b> locks ${ItemUtil.display(item)} with ${ItemUtil.display(characterKey)}.`, [character]);
              } else {
                B.sayAt(character, `You close and lock ${ItemUtil.display(item)} with ${ItemUtil.display(characterKey)}.`);
                B.sayAtExcept(character.room, `<b><white>${character.name}</white></b> closes and locks ${ItemUtil.display(item)} with ${ItemUtil.display(characterKey)}.`, [character]);
              }
              return item.lock();
            }
            // if the character is trying to unlock
            case 'unlock': {
              if (item.locked) {
                if (!characterKey) {
                  return B.sayAt(character, `You don't have the key to unlock ${ItemUtil.display(item)}.`);
                } else {
                  B.sayAt(character, `You unlock ${ItemUtil.display(item)} with ${ItemUtil.display(characterKey)}.`);
                  B.sayAtExcept(character.room, `<b><white>${character.name}</white></b> unlocks ${ItemUtil.display(item)} with ${ItemUtil.display(characterKey)}.`, [character]);
                  return item.unlock();
                }
              }
              if (item.closed) {
                return B.sayAt(character, `${ItemUtil.display(item)} is already unlocked.`);
              } else {
                return B.sayAt(character, `${ItemUtil.display(item)} is already open.`);   
              }
            }
          }
        }
      }

      // if a target was found but the command can't apply to it
      if (validTarget) {
        return B.sayAt(character, `You can't ${action} that.`);
      } else {
        return B.sayAt(character, B.capitalize(`${action} what?`));
      }
    }
  };
};
