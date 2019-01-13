'use strict';

const humanize = (sec) => { return require('humanize-duration')(sec, { round: true }); };
const chalk = require('chalk');

/**
 * Use an item with the `usable` behavior
 * 
 * @param {string}    args       Arguments provided for the command
 * @param {Character} character  Character manipulating the door
 * @param {string}    arg0       The actual command string supplied, useful when checking which alias was used for a command  
 */
module.exports = (srcPath) => {
  const Broadcast = require(srcPath + 'Broadcast');
  const Logger = require(srcPath + 'Logger');
  const CommandParser = require(srcPath + 'CommandParser');
  const ItemUtil = require(srcPath + 'Util/ItemUtil');
  const SkillErrors = require(srcPath + 'Error/SkillErrors');

  return {
    command: state => (args, character, arg0) => {
      const say = message => Broadcast.sayAt(character, message);
      args = args.trim();
      
      // stop if no argument was provided
      if (!args.length) {
        return say(Broadcast.capitalize(`${arg0} what?`));
      }

      let parts,
      item;

      // if more than one arguments were provided
      // (e.g., 'use wand on man')
      if (args.split(' ').length > 1) {
        // strip article
        // (e.g., 'use wand on man' becomes 'use wand man')
        parts = args.split(' ').filter(arg => !arg.match(/on/));

        // determine the item to use from the character's inventory or equipment
        item = CommandParser.parseDot(parts[0], character.inventory)
            || CommandParser.parseDot(parts[0], character.equipment);
      // otherwise, if there was only one argument provided
      } else {
        // determine the item to use from the character's inventory or equipment
        item = CommandParser.parseDot(args, character.inventory)
            || CommandParser.parseDot(args, character.equipment);
      }

      // stop if the character doesn't have that item
      if (!item) {
        return say("You don't have that.");
      }

      const usable = item.getBehavior('usable');
      // stop if the item isn't usable
      if (!usable) {
        return say(`You can't ${arg0} that.`);
      }

      // stop if the item has charges and is out of them
      if ('charges' in usable && usable.charges <= 0) {
        return say(`You've depleted the energy in ${ItemUtil.display(item)}.`);
      }

      // if the item has a usable spell
      if (usable.spell) {
        // determine the spell
        const useSpell = state.SpellManager.get(usable.spell);

        // stop if the spell can't be found
        if (!useSpell) {
          Logger.error(chalk.yellow.bold(`Item: ${item.entityReference} has invalid usable configuration`));
          return say(`You can't ${arg0} that.`);
        }

        let target = false;

        // stop if the spell requires a target but none was provided
        if (useSpell.requiresTarget && !parts) {
          return say(`${Broadcast.capitalize(arg0)} that on whom?`)
        // if the spell requires a target, determine it
        } else if (useSpell.requiresTarget) {
          // if they targeted themselves, select them
          if (parts[1] === 'me' || parts[2] === 'self') {
            target = character;
          // otherwise, find the target in the room (prioritizing players)
          } else {
            target = CommandParser.parseDot(parts[1], character.room.players) ||
                    CommandParser.parseDot(parts[1], character.room.npcs)
          }
        }

        // use the spell options from the item
        useSpell.options = usable.options;

        // use the cooldown from the item
        if (usable.cooldown) {
          useSpell.cooldownLength = usable.cooldown;
        }

        // if the requires a target and one is provided
        if (useSpell.requiresTarget === true && target !== false) {
          // attempt to execute the configured spell on the target
          try {
            useSpell.execute(/* args */ null, character, target);
          } catch (e) {
            if (e instanceof SkillErrors.CooldownError) {
              return say(`${useSpell.name} is on cooldown. ${humanize(e.effect.remaining)} remaining.`);
            }

            if (e instanceof SkillErrors.PassiveError) {
              return say(`That skill is passive.`);
            }

            if (e instanceof SkillErrors.NotEnoughResourcesError) {
              return say(`You do not have enough resources.`);
            }

            Logger.error(e.message);
            return Broadcast.sayAt(character, 'Huh?');
          }
        // otherwise if the spell requires no target and one wasn't provided
        } else if (useSpell.requiresTarget === false && !parts) {
          // attempt to execute the configured spell
          try {
            useSpell.execute(/* args */ null, character);
          } catch (e) {
            if (e instanceof SkillErrors.CooldownError) {
              return say(`${useSpell.name} is on cooldown. ${humanize(e.effect.remaining)} remaining.`);
            }

            if (e instanceof SkillErrors.PassiveError) {
              return say(`That skill is passive.`);
            }

            if (e instanceof SkillErrors.NotEnoughResourcesError) {
              return say(`You do not have enough resources.`);
            }

            Logger.error(e.message);
            return Broadcast.sayAt(character, 'Huh?');
          }
        // otherwise if the spell requires a target but none was provided
        } else if (useSpell.requiresTarget === true) {
          return Broadcast.sayAt(character, `${Broadcast.capitalize(arg0)} that on whom?`);
        // otherwise if the spell doesn't require a target but one was provided
        } else if (useSpell.requiresTarget === false) {
          return Broadcast.sayAt(character, 'You can\'t specify a target.');
        }
      }

      // if the item has a usable effect
      if (usable.effect) {
        // configure the effect from the item
        const effectConfig = Object.assign({
          name: item.name
        }, usable.config || {});
        const effectState = usable.state || {};

        // create the effect
        let useEffect = state.EffectFactory.create(usable.effect, character, effectConfig, effectState);

        // stop if the effect can't be created
        if (!useEffect) {
          Logger.error(chalk.yellow.bold(`Item: ${item.entityReference} has invalid usable configuration`));
          return say(`You can't ${arg0} that.`);
        }

        // report failure if adding the effect returns false
        if (!character.addEffect(useEffect)) {
          return say("Nothing happens.");
        }
      }

      // finish if the item doesn't have charges
      if (!('charges' in usable)) {
        return;
      // otherwise, deplete a charge
      } else {
      usable.charges--;
      }

      // if the item should vanish on depletion and it's now out of charges
      if (usable.destroyOnDepleted && usable.charges <= 0) {
        say(`You deplete the energy in ${ItemUtil.display(item)} and it disintegrates into ash.`);
        Broadcast.sayAtExcept(character.room, `<b><white>${Broadcast.capitalize(character.name)}</white></b> depletes the energy in ${ItemUtil.display(item)} and it disintegrates into ash.`, [character]);
        // destroy the item
        if (item.isEquipped) {
          character.unequip(item.metadata.slot);
        }
        state.ItemManager.remove(item, state);
      }
    }
  };
};
