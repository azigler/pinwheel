'use strict';

/**
 * Render a help table for a particular skill a character has
 * 
 * @param {string}    args       Arguments provided for the command
 * @param {Character} character  Character checking the skill help
 */
module.exports = (srcPath) => {
  const B = require(srcPath + 'Broadcast');
  const SkillFlag = require(srcPath + 'SkillFlag');
  const SkillType = require(srcPath + 'SkillType');
  const Broadcast = require(srcPath + 'Broadcast');

  return {
    aliases: [ "ability", "spell", "discipline" ],
    command : state => (args, character) => {
      const say = (message, wrapWidth) => B.sayAt(character, message, wrapWidth);
      let match;

      // stop if no argument was provided
      if (!args.length) {
        return Broadcast.sayAt(character, 'Look up what skill?');
      }

      // if there is more than one argument, require quotes around the skill name to match it
      if (args.split(' ').length > 1) {
        match = args.match(/^(['"])([^\1]+)+\1(?:$|\s+(.+)$)/);
      // otherwise if there is one argument but no quotes, wrap it in quotes to match it
      } else if (!args.includes('"') && !args.includes("'")) {
        match = `"${args}"`.match(/^(['"])([^\1]+)+\1(?:$|\s+(.+)$)/);
      // otherwise if there is one argument and it's wrapped in quotes, match it
      } else {
        match = args.match(/^(['"])([^\1]+)+\1(?:$|\s+(.+)$)/);
      }

      // stop if no matching skill can be found
      if (!match) {
        return Broadcast.sayAt(character, "Skill name must be surrounded in quotes if longer than one word (e.g., skill 'ice skating').");
      }

      // assign skill name
      let [ , , skillName] = match;
      skillName = skillName.replace(/\s/g,'');
      let skill;

      // if the character has any mastery of the skill
      if (character.hasAttribute(skillName)) {
        skill = state.AbilityManager.find(skillName, true);
        if (!skill) {
          skill = state.SpellManager.find(skillName, true);
        }
        if (!skill) {
          skill = state.DisciplineManager.find(skillName, true);
        }
        // stop if the skill doesn't exist or they don't have it
        if (!skill) {
          return say("Huh?");
        }
      // otherwise, stop if the character doesn't know the skill
      } else {
        return say("Huh?");
      }

      // render skill help header
      say('<b>' + B.center(60, skill.name, 'green', '~') + '</b>');

      // if the skill is passive, indicate that
      if (skill.flags.includes(SkillFlag.PASSIVE)) {
        say('<b><magenta>Passive</magenta></b>');
      }
      // otherwise if the skill is a discipline, indicate that
      // TIP: a skill shouldn't be both passive and a discipline (disciplines are already considered passive)
      else if (skill.type === SkillType.DISCIPLINE) {
        say('<b><magenta>Discipline</magenta></b>');
      // otherwise if it's an ability or spell, print the usage syntax
      } else {
        say(`<b><white>Usage</white><yellow>:</yellow></b> ${skill.usage}`);
      }

      // if the skill has a resource cost, print it
      if (skill.resource && skill.resource.cost) {
        say(`<b><white>Cost</white><yellow>:</yellow></b> ${skill.resource.cost} ${skill.resource.attribute}`);
      }

      // if the skill has a cooldown, print it
      if (skill.cooldownLength) {
        say(`<b><white>Cooldown</white><yellow>:</yellow></b> ${skill.cooldownLength} seconds`);
      }
      
      // print a description of the skill
      say(`<b><cyan>${skill.info(character)}<cyan>`, 60);

      // render the skill help bottom border
      say('<b><green>' + B.line(60) + '</green></b>');
    }
  };
};
