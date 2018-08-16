'use strict';

const SkillFlag = require('./SkillFlag');

/**
 * Keeps track of registered skills
 */
class SkillManager extends Map {
  /**
   * @param {Skill} skill
   */
  add(skill) {
    this.set(skill.id, skill);
  }

  /**
   * @param {Skill} skill
   */
  remove(skill) {
    this.delete(skill.name);
  }

  /**
   * Find executable skills
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
