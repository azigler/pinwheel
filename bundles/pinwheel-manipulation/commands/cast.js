'use strict';

/**
 * Cast a spell
 * 
 * @param {string}    args       Arguments provided for the spell
 * @param {Character} character  Character casting the spell
 * @return {boolean}
 */
module.exports = (srcPath) => {
  const Broadcast = require(srcPath + 'Broadcast');
  const Parser = require(srcPath + 'CommandParser');

  return {
    command: state => (args, character) => {
      // stop if no argument was provided
      if (!args.length) {
        return Broadcast.sayAt(character, 'Cast what?');
      }
      
      // determine spell name and target from the supplied arguments
      // e.g. cast "fireball" dummy
      const match = args.match(/^(['"])([^\1]+)+\1(?:$|\s+(.+)$)/);

      // if the supplied arguments don't match the required format
      if (!match) {
        return Broadcast.sayAt(character, "Casting spells must be surrounded in quotes e.g., cast 'fireball' target");
      }

      // assign spell name and target
      const [ , , spellName, targetArgs] = match;

      // get the spell's definition
      const spell = state.SpellManager.find(spellName);

      // if the spell doesn't exist
      if (!spell) {
        return Broadcast.sayAt(character, "Huh?");
      }

      // if the character has any mastery of the spell and they're a player
      if (character.hasAttribute(spellName) && !character.isNpc) {
        // queue the spell for the player
        character.queueCommand({
          execute: _ => {
            character.emit('useSkill', spell, targetArgs);
          },
          label: `cast ${args}`,
        }, spell.lag || state.Config.get('skillLag') || 1000);
      // otherwise, if they're a player and don't have any mastery of the spell
      } else if (!character.isNpc) {
        Broadcast.sayAt(character, 'Huh?');
      // otherwise, if they're an NPC
      } else {
        // determine if the NPC can cast the spell
        if (spell.hasEnoughResources(character)) {
          spell.payResourceCosts(character);
          let target;
          // if they targeted themselves
          if (targetArgs === 'me' || targetArgs === 'self' || targetArgs === 'myself') {
            target = character;
          // otherwise, find the target
          } else {
            target = Parser.parseDot(targetArgs, character.room.npcs) ||
                     Parser.parseDot(targetArgs, character.room.players);
          }
          // cast the spell
          spell.run(args, character, target);
          // if the character doesn't target themselves and this skill initiates combat
          if (target !== character && spell.initiatesCombat) {
            // initiate combat with the target
            character.initiateCombat(target);
          }
        }
      }
    }
  };
};
