'use strict';

const { Random } = require('rando-js');
const Broadcast = require('../Broadcast');

/**
 * A wrapper around rando-js
 * See {@link https://github.com/seanohue/rando} for documentation.
 */
class RandomUtil extends Random {
  /**
   * Check to see if a given percent chance occurs
   * @param {number} percentChance a 0-100 number representing % success chance
   * @return {boolean}
   */
  static probability(percentChance) {
    const rand = Math.random();
    const target = percentChance / 100;
    return target >= rand;
  }
  /**
   * Roll to increase a mastery level
   * @param {String} ability the name of the ability to roll for
   * @return {boolean} whether or not the function succeeded
   */
  static rollMasteryIncrease(character, ability) {
    const mastery = character.getAttributeBase(ability) || 0;
    const intellect = character.getAttributeBase('intellect') || 0;
    const perception = character.getAttributeBase('perception') || 0;
    const luck = character.getAttributeBase('luck') || 0;

    function masterySigmoid(mastery, intellect, perception, luck) {
      const dif = ((intellect/2) + (perception + luck/3))/5;
      const masteryToDecimal = mastery / 100;
      return 1 / (1 + Math.exp(-masteryToDecimal * (-10 + (dif))));
    }

    // get a random decimal between 0 and 1
    const rand = Math.random();
    // get decimal between 0 and 1 to represent character's chance to increase
    const chance = masterySigmoid(mastery, intellect, perception, luck);
    // if the random number is lower than the chance, return true
    return rand <= chance;
  }

  /**
   * Calculate skill gain and enact it if successful
   * @param {Character} character
   * @param {String} skill
   * @return {boolean} if skill increased
   */
  static calculateSkillGain(character, skill) {
    const mastery = character.getAttributeBase(skill);
    const chance = this.rollMasteryIncrease(character, skill);
    if (chance) {
      const newBase = mastery + 1;
      character.setAttributeBase(skill, newBase);
      Broadcast.sayAt(character, `<b><cyan>    !ABILITY UP! </cyan></b><green>${skill.charAt(0).toUpperCase() + skill.substr(1)}</green> is now <b><magenta>${newBase}</b>%</magenta>`);
      return true;
    } else {
      return false;
    }
  }
}

module.exports = RandomUtil;
