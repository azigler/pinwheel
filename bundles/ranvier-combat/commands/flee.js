'use strict';

module.exports = srcPath => {
  const Broadcast = require(srcPath + 'Broadcast');
  const RandomUtil = require(srcPath + 'Util/RandomUtil');
  const say = Broadcast.sayAt;

  return {
    usage: 'flee [direction]',
    command: state => (direction, player) => {
      if (!player.isInCombat()) {
        return say(player, "You can only flee from combat.");
      }

      let possibleRooms = {};
      // TODO: keep hidden rooms hidden (defined as outside of the coordinate grid)
      for (const possibleExit of player.room.exits) {
        possibleRooms[possibleExit.direction] = possibleExit.roomId;
      }

      // TODO: This is in a few places now, there is probably a refactor to be had here
      // but can't be bothered at the moment.
      const coords = player.room.coordinates;
      if (coords) {
        // find exits from coordinates
        const area = player.room.area;
        const directions = {
          north: [0, 1, 0],
          south: [0, -1, 0],
          east: [1, 0, 0],
          west: [-1, 0, 0],
          up: [0, 0, 1],
          down: [0, 0, -1],
        };

        for (const [dir, diff] of Object.entries(directions)) {
          const room = area.getRoomAtCoordinates(coords.x + diff[0], coords.y + diff[1], coords.z + diff[2]);
          if (room) {
            possibleRooms[dir] = room.entityReference;
          }
        }
      }

      let roomId = null;
      if (direction) {
        roomId = possibleRooms[direction];
      } else {
        const entries = Object.entries(possibleRooms);
        if (entries.length) {
          [direction, roomId] = RandomUtil.fromArray(Object.entries(possibleRooms));
        }
      }

      const randomRoom = state.RoomManager.getRoom(roomId);

      if (!randomRoom) {
        say(player, "<bold><red>You can't find anywhere to run</bold>!</red>");
        return;
      }


      const door = player.room.getDoor(randomRoom) || randomRoom.getDoor(player.room);
      if (randomRoom && door && (door.locked || door.closed)) {
        say(player, "<bold><red>In a panic, you run into a closed door</bold>!</red>");
        return;
      }

      say(player, "<bold>You flee from the battle</bold>!");
      player.removeFromCombat();
      state.CommandManager.get('move').execute(direction, player);
    }
  };
};
