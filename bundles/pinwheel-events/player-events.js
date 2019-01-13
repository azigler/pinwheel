'use strict';

const humanize = (sec) => { return require('humanize-duration')(sec, { round: true }); };
const sprintf = require('sprintf-js').sprintf;
const chalk = require('chalk');

module.exports = (srcPath) => {
  const Broadcast = require(srcPath + 'Broadcast');
  const Logger = require(srcPath + 'Logger');
  const Config = require(srcPath + 'Config');
  const SkillErrors = require(srcPath + 'Error/SkillErrors');
  const Combat = require(srcPath + 'Combat');
  const CombatErrors = require(srcPath + 'Error/CombatErrors');

  return  {
    listeners: {
      /**
       * When the player queues a command
       * @param {number} commandIndex Command's position in the queue
       */
      commandQueued: state => function (commandIndex) {
        const command = this.commandQueue.queue[commandIndex];
        const ttr = sprintf('%.1f', this.commandQueue.getTimeTilRun(commandIndex));
        // if there is a wait time for this command, announce it
        if (ttr > 0) {
          Broadcast.sayAt(this, `<b><white>Executing</white> '<yellow>${command.label}</yellow>' <white>in</white> <magenta>${ttr}</magenta> <white>seconds</white><yellow>.</yellow></b>`);
        }
      },

      /**
       * Automatically called every N milliseconds, where N is defined in the
       * `setInterval` call to `GameState.PlayerManager.tickAll` in the `pinwheel` executable.
       */
      updateTick: state => function () {
        // if the player has a command pending and there's no command lag, execute it
        if (this.commandQueue.hasPending && this.commandQueue.lagRemaining <= 0) {
          Broadcast.sayAt(this);
          this.commandQueue.execute();
          Broadcast.prompt(this);
        }
        
        // determine how long the player has been idle
        const lastCommandTime = this._lastCommandTime || Infinity;
        const timeSinceLastCommand = Date.now() - lastCommandTime;
        const maxIdleTime = (Math.abs(Config.get('maxIdleMinutes', 20)) * 60000) || Infinity;

        // if the player has been idle too long, save and kick them
        if (timeSinceLastCommand > maxIdleTime) {
          this.save(() => {
            Broadcast.sayAt(this, `<b><white>You were kicked for being idle longer than ${maxIdleTime / 60000} minutes</white><yellow>!</yellow></b>`);

            // close the socket
            this.socket.emit('close');

            // report player quit to Gossip
            this.emit('quit');

            // announce player timeout to server
            const timeoutReporter = {
              name: 'MUD',
              // implements Broadcastable interface
              getBroadcastTargets() {
                return [];
              }
            }
            const timeoutMessage = `${this.name} timed out from being idle.`;
            state.ChannelManager.get('chat').send(state, timeoutReporter, timeoutMessage);

            // log player timeout
            Logger.warn((`${chalk.bold.yellow(this.name)} timed out from being idle.`));
          });
        }
      },

      /**
       * When the player uses a skill
       * @param {Skill} skill Skill being used
       * @param {*} args      Arguments provided for the skill
       */
      useSkill: state => function (skill, args) {
        let target = null;
        // if the skill requires a target
        if (skill.requiresTarget) {
          // if no target was provided
          if (!args || !args.length) {
            // if the skill targets self by default, assume that
            if (skill.targetSelf) {
              target = this;
            // if the player is in combat, assume their current combat target
            } else if (this.isInCombat()) {
              target = [...this.combatants][0];
            // otherwise, assume no target
            } else {
              target = null;
            }
          // otherwise, if a target was provided
          } else {
            // look for the target
            try {
              // if they targeted themselves
              if (args === 'me' || targetArgs === 'self') {
                target = this;
              // otherwise, find the target
              } else {
                const targetSearch = args.split(' ').pop();
                // search for a target with the same rules as initiating combat
                target = Combat.findCombatant(this, targetSearch);
              }
            } catch (e) {
              // if the target throws a known combat error, report that error
              if (
                e instanceof CombatErrors.CombatSelfError ||
                e instanceof CombatErrors.CombatNonPvpError ||
                e instanceof CombatErrors.CombatInvalidTargetError ||
                e instanceof CombatErrors.CombatPacifistError
              ) {
                return Broadcast.sayAt(this, e.message);
              }

              // otherwise, log the error
              Logger.error(e.message);
            }
          }

          // if no target was found and the skill requires one, fail and ask for clarification
          if (!target) {
            return Broadcast.sayAt(this, `Use ${skill.name} on whom?`);
          }
        }

        // once the target (if needed) has been found, try executing the command
        try {
          skill.execute(args, this, target);
        } catch (e) {
          // if the skill is on cooldown
          if (e instanceof SkillErrors.CooldownError) {
            if (skill.cooldownGroup) {
              return Broadcast.sayAt(this, `Cannot use ${skill.name} while ${e.effect.config.skill.name} is on cooldown.`);
            }
            return Broadcast.sayAt(this, `${skill.name} is on cooldown. ${humanize(e.effect.remaining)} remaining.`);
          }

          // if the skill is passive and cannot be executed
          if (e instanceof SkillErrors.PassiveError) {
            return Broadcast.sayAt(this, `That skill is passive.`);
          }

          // if the player lacks the resources required to use the command
          if (e instanceof SkillErrors.NotEnoughResourcesError) {
            return Broadcast.sayAt(this, `You do not have enough resources.`);
          }

          // log the error
          Logger.error(e.message);

          // fail and ask for clarification
          Broadcast.sayAt(this, 'Huh?');
        }
      },

      /**
       * When the player gains or loses currency
       * @param {String} currency
       * @param {Integer} amount
       */
      currency: state => function (currency, amount) {
        // determine the currency
        let friendlyName = currency.replace('_', ' ');
        const key = `currencies.${currency}`;

        // if the player doesn't have any of this currency, define it first
        if (!this.getMeta('currencies')) {
          this.setMeta('currencies', {});
        }

        // alter the player's currency accordingly
        this.setMeta(key, (this.getMeta(key) || 0) + amount);

        // save the player
        this.save();

        // account for a single cowry
        if (amount === 1 && friendlyName === 'cowries') { friendlyName = 'cowry' }

        // if the amount is positive, use green text
        if (amount > 0) {
          Broadcast.sayAt(this, `<green>You gained <b>${amount}</green> <white>${friendlyName}</white><yellow>.</yellow></b>`);
          // if the amount is negative, use red text
        } if (amount < 0) {
          Broadcast.sayAt(this, `<red>You lost <b>${amount}</red> <white>${friendlyName}</white><yellow>.</yellow></b>`);
        }
        
      },

      /**
       * Handle a player equipping an item
       * TIP: for equipment with `stats` property in its `metadata`
       * @param {string} slot   Slot on which the item is equipped
       * @param {Item} item     Equipped item
       */
      equip: state => function (slot, item) {
        // if the item doesn't have stats in its metadata, return
        if (!item.metadata.stats) {
          return;
        }

        // define config for equip effect
        const config = {
          name: 'Equip: ' + slot,
          type: 'equip.' + slot
        };

        // prepare equip effect
        const effectState = {
          slot,
          stats: item.metadata.stats,
        };

        // create and add equip effect to the player
        this.addEffect(state.EffectFactory.create(
          'equip',
          this,
          config,
          effectState
        ));
      }
    }
  };
};
