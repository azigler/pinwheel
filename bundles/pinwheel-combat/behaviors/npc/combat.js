'use strict';

/**
 * NPC events for combat
 */
module.exports = (srcPath) => {
  const Combat = require(srcPath + 'Combat');
  const B = require(srcPath + 'Broadcast');
  const Item = require(srcPath + 'Item');
  const Logger = require(srcPath + 'Logger');

  return  {
    listeners: {
      /**
       * Every server tick on the NPC
       * @param {*} config Behavior config
       */
      updateTick: state => function (config) {
        Combat.regenerateAfterCombat(state, this);
        Combat.updateRound(state, this);
      },

      /**
       * When the NPC hits a target
       * @param {*} config Behavior config
       * @param {Damage} damage
       * @param {Character} target
       */
      hit: state => function (config, damage, target) {
        if (damage.hidden) {
          return;
        }

        // alert NPC's weapon that it made a hit
        if (this.equipment.has('wield')) {
          this.equipment.get('wield').emit('hit', damage, target);
        }

        // tell room
        let buf = '';
        if (damage.source) {
          buf = `${B.capitalize(this.name)}'s <b>${damage.source.name}</b> hit`;
        } else {
          buf = `${B.capitalize(this.name)} hit`;
        }

        buf += ` <b>${target.name}</b> for <b>${damage.finalAmount}</b> damage.`;
        B.sayAtExcept(this.room, buf, [this, target]);
      },

      /**
       * When the NPC is damaged
       * @param {*} config Behavior config
       * @param {Damage} damage
       */
      damaged: state => function (config, damage) {
        // if this damage kills the NPC, record the killer
        if (this.getAttribute('health') <= 0 && damage.attacker) {
          this.combatData.killedBy = damage.attacker;
          Combat.handleDeath(state, this, damage.attacker);
        }
      },

      /**
       * When the NPC heals a target
       * @param {*} config Behavior config
       * @param {Heal} heal
       * @param {Character} target
       */
      heal: state => function (config, heal, target) {
        if (heal.hidden) {
          return;
        }

        // tell room
        let buf = '';
        if (heal.source) {
          buf = `${B.capitalize(this.name)}'s <b>${heal.source.name}</b> heals`;
        } else {
          buf = `${B.capitalize(this.name)} heals`;
        }

        buf += ` <b>${target.name}</b>`;
        buf += ` for <b><green>${heal.finalAmount}</green></b> ${heal.attribute}.`;
        B.sayAtExcept(this.room, buf, [this, target]);
      },

      /**
       * When the NPC is healed
       * @param {*} config Behavior config
       * @param {Heal} heal
       */
      healed: state => function (config, heal) {
        // nothing to do
      },

      /**
       * When the NPC dodges an attacker
       * @param {*} config Behavior config
       * @param {Character} attacker
       */
      dodge: state => function (config, attacker) {
        // tell room
        let buf = `<b>${B.capitalize(this.name)}</b> dodges <b>${attacker.name}'s</b> attack.`;
        B.sayAtExcept(this.room, buf, [this, attacker]);
      },

      /**
       * When a target dodges the NPC
       * @param {*} config Behavior config
       * @param {Character} target
       */
      dodged: state => function (config, target) {
        // nothing to do
      },

      /**
       * When the NPC blocks an attacker
       * @param {*} config Behavior config
       * @param {Character} attacker
       */
      block: state => function (config, attacker) {
        // alert NPC's shield that it blocked
        if (this.equipment.has('held')) {
          this.equipment.get('held').emit('block', attacker);
        }

        // tell room
        let buf = `<b>${B.capitalize(this.name)}</b> blocks <b>${attacker.name}'s</b> attack.`;
        B.sayAtExcept(this.room, buf, [this, attacker]);
      },

      /**
       * When a target blocks the NPC
       * @param {*} config Behavior config
       * @param {Character} target
       */
      blocked: state => function (config, target) {
        // nothing to do
      },

      /**
       * When the NPC is killed
       * @param {*} config Behavior config
       * @param {Character} killer
       */
      killed: state => function (config, killer) {
        // tell room
        const othersDeathMessage = killer ?
          `<b><red>${B.capitalize(killer.name)} kills ${this.name}!</b></red>` :
          `<b><red>${B.capitalize(this.name)} collapses to the ground, dead!</b></red>`;
        B.sayAtExcept(this.room, othersDeathMessage, (killer ? [killer, this] : this));

        // if the NPC isn't lootable
        if (!this.behaviors.get('lootable')) {
          // produce a corpse
          const corpseData = {
            entityReference: 'start:corpse',
            uuid: this.uuid,
            id: 'corpse',
            name: `corpse of ${this.name}`,
            roomDesc: `the corpse of ${this.name}`,
            description: `This is the corpse of ${this.name}.`,
            keywords: this.keywords.concat(['corpse']),
            metadata: {
              noRetrieve: true,
            },
            behaviors: {
              decay: {
                duration: 180
              }
            },
          };
          const corpse = new Item(this.area, corpseData);
          corpse.hydrate(state, corpseData);

          // add corpse to room
          this.room.addItem(corpse);
          state.ItemManager.add(corpse);
        }
      },

      /**
       * When the NPC kills a target
       * @param {*} config Behavior config
       * @param {Character} target
       */
      deathblow: state => function (config, target) {
        // TODO: determine how much experience the target gave
        const xp = 100;

        // give experience to the NPC
        this.emit('currency', 'experience', xp);
      },

      /**
       * When the NPC gains experience
       * @param {*} config Behavior config
       * @param {number} amount Experience gained
       */
      experience: state => function (config, amount) {
        const key = `currencies.experience`;

        if (!this.getMeta('currencies')) {
          this.setMeta('currencies', {});
        }

        this.setMeta(key, (this.getMeta(key) || 0) + amount);
      },

      /**
       * When the NPC receives currency
       * @param {*} config Behavior config
       * @param {String} currency
       * @param {Integer} amount
       */
      currency: state => function (config, currency, amount) {
        const key = `currencies.${currency}`;

        if (!this.getMeta('currencies')) {
          this.setMeta('currencies', {});
        }

        this.setMeta(key, (this.getMeta(key) || 0) + amount);
      }
    }
  };
};
