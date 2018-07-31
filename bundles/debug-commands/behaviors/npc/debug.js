'use strict';


module.exports = (srcPath) => {
  const Logger = require(srcPath + 'Logger');
  const Broadcast = require(srcPath + 'Broadcast');
  return  {
    listeners: {
      spawn: state => function (config) {
        Logger.log(`${this.name} spawned into room ${this.room.title}`);
      },

      playerEnter: state => function (config, player) {
        Broadcast.sayAt(player, `${this.name} noticed ${player.name} enter room`);
        Logger.log(`${this.name} noticed ${player.name} enter room`);
      },

      playerLeave: state => function (config, target, destination) {
        Logger.log(`${target.name} left ${this.room.title} towards ${destination.title}`);
      },

      playerDropItem: state => function(config, player, item) {
        Logger.log(`${this.name} noticed ${player.name} dropped ${item.name}`);
      },

      hit: state => function(config, damage, target) {
        Logger.log(`${this.name} hit ${target.name} for ${damage.finalAmount}`);
      },

      damaged: state => function (config, damage) {
        Logger.log(`${this.name} damaged ${damage.finalAmount}`);
      },

      npcLeave: state => function (config, target, destination) {
        Logger.log(`${target.name} left ${this.room.title} towards ${destination.title}`);
      },

      npcEnter: state => function (config, target) {
        Logger.log(`${target.name} entered same room as ${this.name}`);
      },
    }
  };
};
