'use strict';

const Broadcast = require('../Broadcast');

/**
 * Helper methods for skills
 */
class SkillUtil {
  /**
   * Calculate skill gain for a character
   * @param {Character} character
   * @param {String}    skill
   * @return {boolean}  Whether skill increased
   */
  static calculateSkillGain(character, skill) {
    const skillName = skill.toLowerCase(skill);
    const mastery = character.getAttributeBase(skillName);
    const chance = this.rollMasteryIncrease(character, skillName);
    if (chance) {
      const newBase = mastery + 1;
      character.setAttributeBase(skillName, newBase);
      Broadcast.sayAt(character, ` <b><cyan>!SKILL GAIN!</cyan></b> <green>${Broadcast.capitalize(skillName)}</green> is now <b><magenta>${newBase}</b>%</magenta>`);
      return true;
    } else {
      return false;
    }
  }

  /**
   * Whether a provided skill's mastery level increased
   * @param {String}    skill Name of skill to check
   * @return {boolean}
   */
  static rollMasteryIncrease(character, skill) {
    const mastery = character.getAttributeBase(skill);
    const intellect = character.getAttributeBase('intellect');
    const perception = character.getAttributeBase('perception');
    const luck = character.getAttributeBase('luck');

    // helper function for determining increase chance based on current mastery level
    function masterySigmoid(mastery, intellect, perception, luck) {
      const dif = ((intellect/2) + (perception + luck/3))/5;
      const masteryToDecimal = mastery / 100;
      return 1 / (1 + Math.exp(-masteryToDecimal * (-10 + (dif))));
    }

    // get a random decimal between 0 and 1
    const rand = Math.random();

    // get decimal between 0 and 1 to represent character's chance to increase
    const chance = masterySigmoid(mastery, intellect, perception, luck);

    // if the random number is lower than the chance
    if (rand <= chance) {
      // return true (mastery increased)
      return true;
    } else {
      // return false (mastery did not increase)
      return false;
    }
  }

  /**
   * Determine if the skill has branched
   * @param {Character} character
   * @param {Skill}     skill
   * @return {boolean}  Whether the skill branched
   */
  static checkBranches(character, skill) {
    const skillName = skill.name.toLowerCase();
    const branches = skill.branches;
    for (const level in branches) {
      for (const sk of branches[level]) {
        if (character.getAttributeBase(skillName) >= level) {
          character.addSkill(sk);
        }
      }
    }
  }
}

module.exports = SkillUtil;
