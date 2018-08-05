'use strict';

/**
 * Log NPC events to console for debugging purposes.
 */
module.exports = (srcPath) => {
  const Logger = require(srcPath + 'Logger');

  return  {
    listeners: {
      playerEnter: state => function (config, player) {
        Logger.log(`${this.name} saw ${player.name} enter ${this.room.title} (${this.room.entityReference})`);
      },

      playerLeave: state => function (config, player, destination) {
        Logger.log(`${this.name} saw ${player.name} leave ${this.room.title} (${this.room.entityReference}) toward ${destination.title} (${destination.entityReference})`);
      },

      playerDropItem: state => function(config, player, item) {
        Logger.log(`${this.name} saw ${player.name} drop ${item.name} in ${this.room.title} (${this.room.entityReference})`);
      },

      combatantAdded: state => function(config, target) {
        Logger.log(`${this.name} and ${target.name} started fighting in ${this.room.title} (${this.room.entityReference})`);
      },

      killed: state => function(config) {
        Logger.log(`${this.name} died in ${this.room.title} (${this.room.entityReference}).`);
      },

      hit: state => function(config, damage, target) {
        Logger.log(`${this.name} hit ${target.name} for ${damage.finalAmount} ${damage.attribute} in ${this.room.title} (${this.room.entityReference})`);
      },

      damaged: state => function (config, damage) {
        Logger.log(`${this.name} was damaged ${damage.finalAmount} ${damage.attribute} by ${damage.attacker.name} in ${this.room.title} (${this.room.entityReference})`);
      },

      heal: state => function(config, heal, target) {
        Logger.log(`${this.name} healed ${target.name} for ${heal.finalAmount} ${heal.attribute} in ${this.room.title} (${this.room.entityReference})`);
      },

      healed: state => function (config, heal) {
        Logger.log(`${this.name} was healed ${heal.finalAmount} ${heal.attribute} in ${this.room.title} (${this.room.entityReference})`);
      },

      npcLeave: state => function (config, target, destination) {
        if (target.uuid === this.uuid) return;
        Logger.log(`${this.name} saw ${target.name} leave ${this.room.title} toward ${destination.title} (${destination.entityReference})`);
      },

      npcEnter: state => function (config, target) {
        if (target.uuid === this.uuid) return;
        Logger.log(`${this.name} saw ${target.name} enter ${this.room.title} (${this.room.entityReference})`);
      },
    }
  };
};
