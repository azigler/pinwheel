'use strict';

/**
 * Used by the core to differentiate between skills, spells, and disciplines.
 * @enum {Symbol}
 */
const SkillType = {
  ABILITY: Symbol("ABILITY"),
  SPELL: Symbol("SPELL"),
  DISC: Symbol("DISC")
};

module.exports = SkillType;
