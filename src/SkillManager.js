'use strict';

const SkillFlag = require('./SkillFlag');

/**
 * Keep track of registered skills
 * 
 * @extends Map
 */
class SkillManager extends Map {
  /**
   * Add a skill
   * @param {Skill} skill
   */
  add(skill) {
    this.set(skill.id, skill);
  }

  /**
   * Remove a skill
   * @param {Skill} skill
   */
  remove(skill) {
    this.delete(skill.name);
  }

  /**
   * Find an executable skill
   * @param {string}  search
   * @param {boolean} includePassive
   * @return {Skill}
   */
  find(search, includePassive = false) {
    for (const [ id, skill ] of this) {
      if (!includePassive && skill.flags.includes(SkillFlag.PASSIVE)) {
        continue;
      }

      if (id.indexOf(search) === 0) {
        return skill;
      }
    }
  }
}

module.exports = SkillManager;
