'use strict';

/**
 * Define all channels for the server.
 */
module.exports = (srcPath) => {
  const WorldAudience = require(srcPath + 'ChannelAudience/WorldAudience');
  const AreaAudience = require(srcPath + 'ChannelAudience/AreaAudience');
  const RoomAudience = require(srcPath + 'ChannelAudience/RoomAudience');
  const RoleAudience = require(srcPath + 'ChannelAudience/RoleAudience');
  const PrivateAudience = require(srcPath + 'ChannelAudience/PrivateAudience');
  const PartyAudience = require(srcPath + 'ChannelAudience/PartyAudience');
  const PlayerRoles = require(srcPath + 'PlayerRoles');
  const Channel = require(srcPath + 'Channel');

  return [
    new Channel({
      name: 'chat',
      aliases: ['.'],
      color: ['bold', 'green'],
      description: 'Send a message to everyone connected',
      audience: new WorldAudience()
    }),

    new Channel({
      name: 'say',
      aliases: ["'"],
      description: 'Send a message to all players in your room',
      audience: new RoomAudience(),
      formatter: {
        sender: function (sender, target, message, colorify) {
          return colorify(`You say, '<b><white>${message}</white></b>'`);
        },

        target: function (sender, target, message, colorify) {
          return colorify(`${sender.name} says, '<b><white>${message}</white></b>'`);
        }
      }
    }),

    new Channel({
      name: 'tell',
      aliases: [','],
      description: 'Send a private message to another player',
      audience: new PrivateAudience(),
      formatter: {
        sender: function (sender, target, message, colorify) {
          return colorify(`You tell ${target.name}, '<b><cyan>${message}</cyan></b>'`);
        },

        target: function (sender, target, message, colorify) {
          return colorify(`${sender.name} tells you, '<b><cyan>${message}</cyan></b>'`);
        }
      }
    }),

    new Channel({
      name: 'yell',
      description: 'Send a message to everyone in your area',
      audience: new AreaAudience(),
      formatter: {
        sender: function (sender, target, message, colorify) {
          return colorify(`You yell, '<yellow>${message}</yellow>'`);
        },

        target: function (sender, target, message, colorify) {
          // check if the target is in the same room as the sender
          if (target.room.getBroadcastTargets().indexOf(sender) > -1) {
            return colorify(`${sender.name} yells, '<yellow>${message}</yellow>'`);
          } else {
            return colorify(`Someone yells, '<yellow>${message}</yellow>'`);
          }
        }
      }
    }),

    new Channel({
      name: 'gtell',
      description: 'Send a message to everyone in your group',
      audience: new PartyAudience(),
      formatter: {
        sender: function (sender, target, message, colorify) {
          return colorify(`You tell your group, '<b><yellow>${message}</yellow></b>'`);
        },

        target: function (sender, target, message, colorify) {
          return colorify(`${sender.name} tells your group, '<b><yellow>${message}</yellow></b>'`);
        }
      }
    }),

    new Channel({
      name: 'admin',
      color: ['bold', 'red'],
      description: 'Send a message to all admins connected',
      audience: new RoleAudience({ minRole: PlayerRoles.ADMIN })
    }),

    new Channel({
      name: 'builder',
      color: ['bold', 'magenta'],
      description: 'Send a message to all builders connected',
      audience: new RoleAudience({ minRole: PlayerRoles.BUILDER })
    })
  ];
};
