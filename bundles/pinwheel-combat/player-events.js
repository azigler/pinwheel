'use strict';

const WebsocketStream = require('../ranvier-websocket/lib/WebsocketStream');

/**
 * Player events for combat
 */
module.exports = (srcPath) => {
  const B = require(srcPath + 'Broadcast');
  const LevelUtil = require(srcPath + './Util/LevelUtil');
  const Combat = require(srcPath + 'Combat');
  const CombatErrors = require(srcPath + 'Error/CombatErrors');
  const Item = require(srcPath + 'Item');
  const Logger = require(srcPath + 'Logger');

  return  {
    listeners: {
      /**
       * Every server tick on the player
       */
      updateTick: state => function () {
        Combat.regenerateAfterCombat(state, this);

        let hadActions = false;
        try {
          hadActions = Combat.updateRound(state, this);
        } catch (e) {
          if (e instanceof CombatErrors.CombatInvalidTargetError) {
            B.sayAt(this, "You can't attack that target.");
          } else {
            throw e;
          }
        }

        if (!hadActions) {
          return;
        }
      },

      /**
       * When the player receives currency after combat
       * @param {String} currency
       * @param {Integer} amount
       */
      currency: state => function (currency, amount) {
          let friendlyName = currency.replace('_', ' ');
          const key = `currencies.${currency}`;

          if (!this.getMeta('currencies')) {
            this.setMeta('currencies', {});
          }
          this.setMeta(key, (this.getMeta(key) || 0) + amount);
          this.save();

          // account for single cowry
          if (amount === 1 && friendlyName === 'cowries') { friendlyName = 'cowry' };

          B.sayAt(this, `<green>You receive <b>${amount}</green> <white>${friendlyName}</white></b>.`);
      },

      /**
       * When the player (or one of their effects) hits a target
       * @param {Damage} damage
       * @param {Character} target
       */
      hit: state => function (damage, target) {
        if (damage.hidden) {
          return;
        }

        let buf = '';
        // if from an ability or effect belonging to the player
        if (damage.source) {
          buf = `<b>Your <yellow>${damage.source.name}</yellow></b> hit`;
        } else {
          buf = "<b>You</b> hit";
          // alert player's weapon that it made a hit
          if (this.equipment.has('wield')) {
            this.equipment.get('wield').emit('hit', damage, target);
          }
        }

        buf += ` <b>${target.name}</b> for <b><red>${damage.finalAmount}</red></b> damage.`;

        // if critical
        if (damage.critical) {
          buf += ' <red><b>(Critical)</b></red>';
        }

        // tell player
        B.sayAt(this, buf);

        // show combat prompt
        showPrompt(this);

        // tell room
        buf = '';
        if (damage.source) {
          buf = `${this.name}'s <b>${damage.source.name}</b> hit`;
        } else {
          buf = `${this.name} hit`;
        }

        buf += ` <b>${target.name}</b> for <b>${damage.finalAmount}</b> damage.`;
        B.sayAtExcept(this.room, buf, [this, target]);
      },

      /**
       * When the player is damaged
       * @param {Damage} damage
       */
      damaged: state => function (damage) {
        if (damage.hidden || damage.attribute !== 'health') {
          return;
        }

        // if this damage kills the player, record the killer
        if (this.getAttribute('health') <= 0 && damage.attacker) {
          this.combatData.killedBy = damage.attacker;
        }

        let buf = '';
        if (damage.attacker) {
          buf = `<b>${damage.attacker.name.charAt(0).toUpperCase() + damage.attacker.name.substr(1)}</b>`;
        } else if (!damage.attacker) {
          buf += "<b>Something</b>";
        }

        // if from an ability or effect belonging to the attacker
        if (damage.source) {
          buf += (damage.attacker ? "<b>'s</b> " : " ") + `<b><yellow>${damage.source.name}</yellow></b>`;
        } 

        buf += ` hits <b>You</b> for <b><red>${damage.finalAmount}</red></b> damage.`;

        // if critical
        if (damage.critical) {
          buf += ' <red><b>(Critical)</b></red>';
        }

        // tell player
        B.sayAt(this, buf);
      },

      /**
       * When the player (or one of their effects) heals a target
       * @param {Heal} heal
       * @param {Character} target
       */
      heal: state => function (heal, target) {
        if (heal.hidden) {
          return;
        }

        let buf = '';

        // if the player heals themselves, broadcast just once with the 'healed' event (not here)
        if (target !== this) {
          // if from an ability or effect belonging to the player
          if (heal.source) {
            buf = `Your <b><yellow>${heal.source.name}</yellow></b> `;
          } else {
            buf = "You ";
          }

          // use correct language depending on attribute
          if (heal.attribute === 'health') {
            buf = `heals <b>${target.name}</b> by <b><green>${heal.finalAmount}</green></b> health.`
          } else {
            buf = `restores <b><cyann>${heal.finalAmount}</cyan></b> ${heal.attribute} to <b>${target.name}</b>.`;
          }

          // tell player
          B.sayAt(this, buf);
        }

        // show combat prompt
        showPrompt(this);

        // tell room
        buf = '';
        if (heal.source) {
          buf = `${this.name}'s <b>${heal.source.name}</b> heals`;
        } else {
          buf = `${this.name} heals`;
        }

        buf += ` <b>${target.name}</b>`;
        buf += ` for <b><green>${heal.finalAmount}</green></b> ${heal.attribute}.`;
        B.sayAtExcept(this.room, buf, [this, target]);
      },

      /**
       * When the player is healed
       * @param {Heal} heal
       */
      healed: state => function (heal) {
        if (heal.hidden) {
          return;
        }

        let buf,
        healer,
        source,
        verb,
        you = '';


        if (heal.healer && heal.healer !== this) {
          healer = `<b>${heal.healer.name.charAt(0).toUpperCase() + heal.healer.name.substr(1)}</b> `;
        }

        // if from an ability or effect belonging to the healer
        if (heal.source) {
          healer = healer ? healer + "'s " : '';
          source = `<b><yellow>${heal.source.name}</yellow></b>`;
        } else if (!heal.healer) {
          source = "<b>Something</b>";
        }

        // if the player healed themselves
        if (heal.healer === this) {
          healer = `<b>You</b>`;
          if (heal.source) {
            healer = `<b>Your</b> `;
            source = `<b><yellow>${heal.source.name}</yellow></b>`;
          }
        }

        // use correct word for 'you', depending on tense
        you = (heal.healer === this) ? `Yourself` : `You`;

        // use correct statement depending on attribute
        if (heal.attribute === 'health') {
          verb = (heal.healer === this) ? `heal` : `heals`;
          buf = `${healer}${source} ${verb} <b>${you}</b> by <b><green>${heal.finalAmount}</green></b> health.`;
        } else {
          verb = (heal.healer === this) ? `restore` : `restores`;

          buf = `${healer}${source} ${verb} <b><cyan>${heal.finalAmount}</cyan></b> ${heal.attribute} to <b>${you}</b>.`;
        }
        // tell player
        B.sayAt(this, buf);

        // show combat prompt
        showPrompt(this);
      },

      /**
       * When the player dodges an attacker
       * @param {Character} attacker
       */
      dodge: state => function (attacker) {
        let buf = `<b>You</b> dodge <b>${attacker.name}'s</b> attack.`;

        // tell player
        B.sayAt(this, buf);

        // tell room
        buf = `<b>${this.name}</b> dodges <b>${attacker.name}'s</b> attack.`;
        B.sayAtExcept(this.room, buf, [this, attacker]);
      },

      /**
       * When a target dodges the player
       * @param {Character} target
       */
      dodged: state => function (target) {
        let buf = `<b>${target.name.charAt(0).toUpperCase() + target.name.substr(1)}</b> dodges <b>Your</b> attack.`;

        // tell player
        B.sayAt(this, buf);
      },

      /**
       * When the player blocks an attacker
       * @param {Character} attacker
       */
      block: state => function (attacker) {
        let buf = `<b>You</b> block <b>${attacker.name}'s</b> attack.`;

        // alert player's shield that it blocked
        if (this.equipment.has('held')) {
          this.equipment.get('held').emit('block', damage, target);
        }

        // tell player
        B.sayAt(this, buf);

        // tell room
        buf = `<b>${this.name}</b> blocks <b>${attacker.name}'s</b> attack.`;
        B.sayAtExcept(this.room, buf, [this, attacker]);
      },

      /**
       * When a target blocks the player
       * @param {Character} target
       */
      blocked: state => function (target) {
        let buf = `<b>${target.name.charAt(0).toUpperCase() + target.name.substr(1)}</b> blocks <b>Your</b> attack.`;

        // tell player
        B.sayAt(this, buf);
      },

      /**
       * When the player is killed
       * @param {Character} killer
       */
      killed: state => function (killer) {
        // remove combat prompt
        this.removePrompt('combat');

        // tell player
        if (killer && killer !== this) {
          B.sayAt(this, `<b><red>You were killed by ${killer.name}!</red></b>`);
        } else {
          B.sayAt(this, '<b><red>You died!</red></b>');
        }

        // tell room
        const othersDeathMessage = killer ?
          `<b><red>${this.name} collapses to the ground, killed by ${killer.name}!</b></red>` :
          `<b><red>${this.name} collapses to the ground, dead!</b></red>`;
        B.sayAtExcept(this.room, othersDeathMessage, (killer ? [killer, this] : this));

        // tell party
        if (this.party) {
          B.sayAtExcept(this.party, `<b><green>${this.name} was killed!</green></b>`, this);
        }

        // produce a corpse
        const corpseData = {
          id: '99',
          name: `corpse of ${this.name}`,
          roomDesc: `the corpse of ${this.name}`,
          description: `This is the rotting corpse of ${this.name}.`,
          keywords: this.keywords.concat(['corpse']),
          metadata: {
            noPickup: true,
          },
          behaviors: {
            decay: {
              duration: 180
            }
          },
        };
        const corpse = new Item(this.area, corpseData);
        corpse.hydrate(state, corpseData);
        Logger.log(`Generated corpse: ${corpse.uuid}`);

        // TODO: handle player items in corpse

        // add corpse to room
        this.room.addItem(corpse);
        state.ItemManager.add(corpse);

        // fully restore player's health
        this.setAttributeToMax('health');

        // find the respawn room for the player
        let home = state.RoomManager.getRoom(this.getMeta('waypoint.home'));
        if (!home) {
          home = state.RoomManager.startingRoom;
        }

        // respawn the player
        this.moveTo(home, _ => {
          // force player to look at room
          state.CommandManager.get('look').execute(null, this);

          // player loses 20% of experience gained this level upon death
          const lostExp = Math.floor(this.experience * 0.2);
          this.experience -= lostExp;
          this.save();
          B.sayAt(this, `<red>You lost <b>${lostExp}</b> experience!</red>`);

          // show prompt to player
          B.prompt(this);
        });
      },

      /**
       * When the player kills a target
       * @param {Character} target
       */
      deathblow: state => function (target, skipParty, killerName = this.name) {
        // determine how much experience the target gave
        const xp = LevelUtil.mobExp(target.level);

        if (!skipParty) {
          // tell player
          if (target) {
            B.sayAt(this, `<b><red>You killed ${target.name}!</red></b>`);
          }
          
          // give experience to the player
          this.emit('experience', xp);
        } else {
          const partyMembers = [...this.party].length;
          this.emit('experience', xp / partyMembers);
        }

        // If they're in a party, proxy the deathblow to all members of the party in the same room.
        // This ensures party members get credit for anything listening for this event (like a quest).
        if (this.party && !skipParty) {
          for (const member of this.party) {
            if (member.room === this.room && member !== this) {
              B.sayAtExcept(this.party, `<b><green>${killerName} killed ${target.name}!</green></b>`, this);
              member.emit('deathblow', target, true);
            }
          }
        }
      }
    }
  };

  /**
   * Show the combat prompt to the player
   * @param {Player} promptee
   */
  function showPrompt(promptee) {
    // don't show the combat prompt to a WebSocket client
    const usingWebsockets = promptee.socket instanceof WebsocketStream;

    if (!promptee.hasPrompt('combat') && !usingWebsockets) {
      promptee.addPrompt('combat', _ => promptBuilder(promptee));
    }

    if (!usingWebsockets) {
      B.prompt(promptee);
    }
  }

  /**
   * Build the combat prompt for the player
   * @param {Player} promptee
   */
  function promptBuilder(promptee) {
    if (!promptee.isInCombat()) {
      return '';
    }

    // Set up some constants for formatting the health bars
    const playerName = "You";
    const targetNameLengths = [...promptee.combatants].map(t => t.name.length);
    const nameWidth = Math.max(playerName.length, ...targetNameLengths);
    const progWidth = 60 - (nameWidth + ':  ').length;

    // Set up helper functions for health-bar-building.
    const getHealthPercentage = entity => Math.floor((entity.getAttribute('health') / entity.getMaxAttribute('health')) * 100);
    const formatProgressBar = (name, progress, entity) => {
      const pad = B.line(nameWidth - name.length, ' ');
      return `<b>${name}${pad}</b>: ${progress} <b>${entity.getAttribute('health')}/${entity.getMaxAttribute('health')}</b>`;
    }

    // Build player health bar.
    let currentPerc = getHealthPercentage(promptee);
    let progress = B.progress(progWidth, currentPerc, "green");
    let buf = formatProgressBar(playerName, progress, promptee);

    // Build and add target health bars.
    for (const target of promptee.combatants) {
      let currentPerc = Math.floor((target.getAttribute('health') / target.getMaxAttribute('health')) * 100);
      let progress = B.progress(progWidth, currentPerc, "red");
      buf += `\r\n${formatProgressBar(target.name, progress, target)}`;
    }

    return buf;
  }
};
