'use strict';

/**
 * Used by the core to differentiate between skills, spells, and disciplines.
 * @enum {Symbol}
 */
const SkillType = {
  SKILL: Symbol("SKILL"),
  SPELL: Symbol("SPELL"),
  DISC: Symbol("DISC")
};

module.exports = SkillType;
