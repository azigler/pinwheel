'use strict';

/**
 * Used by the core to differentiate between passive and active skills.
 * @enum {Symbol}
 */
const SkillFlag = {
  PASSIVE: Symbol("PASSIVE"),
  ACTIVE: Symbol("ACTIVE"),
  HIDDEN: Symbol("HIDDEN")
};

module.exports = SkillFlag;
