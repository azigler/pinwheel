'use strict';

/**
 * Move character in a given direction from their current room
 * 
 * @param {string}    exitName   Direction attempting to travel
 * @param {Character} character  Character initiating the command
 * @return {boolean}
 */
module.exports = (srcPath) => {
  const B = require(srcPath + 'Broadcast');
  const Character = require(srcPath + 'Character');

  return {
    aliases: [ "go", "walk" ],
    usage: 'move [direction]',
    command: (state) => (exitName, character) => {
      const oldRoom = character.room;

      // stop if the character is not currently in a room
      if (!oldRoom) {
        return false;
      }

      // stop if the character is currently in combat
      if (character.isInCombat()) {
        return B.sayAt(character, 'You are in the middle of a fight!');
      }

      // look for a defined exit in the supplied direction
      const exit = state.RoomManager.findExit(oldRoom, exitName);
      let nextRoom = null;

      // if there is no defined exit, check the coordinate grid to determine to the next room
      if (!exit) {
        if (oldRoom.coordinates) {
          const coords = oldRoom.coordinates;
          const area = oldRoom.area;
          const directions = {
            north: [0, 1, 0],
            south: [0, -1, 0],
            east: [1, 0, 0],
            west: [-1, 0, 0],
            up: [0, 0, 1],
            down: [0, 0, -1],
          };

          // determine the coordinate offset based on the supplied exit direction
          for (const [dir, diff] of Object.entries(directions)) {
            if (dir.indexOf(exitName) !== 0) {
              continue;
            }

            // determine the next room at those coordinates
            nextRoom = area.getRoomAtCoordinates(coords.x + diff[0], coords.y + diff[1], coords.z + diff[2]);
          }
        // otherwise, stop if there are no defined exits nor coordinates
        } else {
          return B.sayAt(character, "You can't go that way.");
        }
      // otherwise, determine the room in the supplied direction
      } else {
        nextRoom = state.RoomManager.getRoom(exit.roomId);
      }

      // stop if there is no room to enter in the supplied direction
      if (!nextRoom) {
        return B.sayAt(character, "You can't go that way.");
      }

      // check if this room has a door leading to the target room, or vice versa
      const door = oldRoom.getDoor(nextRoom) || nextRoom.getDoor(oldRoom);

      // if there is a door
      if (door) {
        // stop if the door is closed
        if (door.closed) {
          return B.sayAt(character, "The door is closed.");
        }
      }

      // move the character to the destination room and force them to look upon arrival
      character.moveTo(nextRoom, _ => {
        if (!character.isNpc) { state.CommandManager.get('look').execute('', character); }
      });

      // determine the semantic direction they go, in the perspective of the departure room
      let exitDirection = nextRoom.title;
      switch (exitName) {
        case "north": exitDirection = "the north"; break;
        case "south": exitDirection = "the south"; break;
        case "east": exitDirection = "the east"; break;
        case "west": exitDirection = "the west"; break;
        case "up": exitDirection = "above"; break;
        case "down": exitDirection = "below"; break;
      }

      // determine the semantic direction they come from, in the perspective of the destination room
      let arrivalDirection = oldRoom.title;
      switch (exitName) {
        case "north": arrivalDirection = "the south"; break;
        case "south": arrivalDirection = "the north"; break;
        case "east": arrivalDirection = "the west"; break;
        case "west": arrivalDirection = "the east"; break;
        case "up": arrivalDirection = "below"; break;
        case "down": arrivalDirection = "above"; break;
      }

      // announce the character's movement to both rooms
      B.sayAt(oldRoom, B.capitalize(`<b><white>${character.name}</white></b> leaves to ${exitDirection}.`));
      B.sayAtExcept(nextRoom, B.capitalize(`<b><white>${character.name}</white></b> enters from ${arrivalDirection}.`), character);

      // if the character has followers, move them in the same way
      for (const follower of character.followers) {
        if (follower.room !== oldRoom) {
          continue;
        }

        if (follower instanceof Character) {
          B.sayAt(follower, `\r\nYou follow <b><white>${character.name}</white></b> to ${exitDirection}.`);
          state.CommandManager.get('move').execute(exitName, follower);
        } else {
          follower.room.removeNpc(follower);
          nextRoom.addNpc(follower);
        }
      }

      // report movement success
      return true;
    }
  };
};
