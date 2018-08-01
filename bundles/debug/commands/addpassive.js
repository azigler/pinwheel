'use strict';

/**
 * Adds a specified passive skill to self.
 */
module.exports = (srcPath) => {
  const Broadcast = require(srcPath + 'Broadcast');
  const SkillFlag = require(srcPath + 'SkillFlag');
  const PlayerRoles = require(srcPath + 'PlayerRoles');

  return {
    requiredRole: PlayerRoles.ADMIN,
    command: (state) => (args, player) => {
      if (!args.length) {
        return Broadcast.sayAt(player, 'Add a passive skill to self. <b>addpassive <name></b>');
      }

      const skill = state.SkillManager.get(args);
      if (!skill) {
        return Broadcast.sayAt(player, "No such skill.");
      }

      if (!skill.flags.includes(SkillFlag.PASSIVE)) {
        return Broadcast.sayAt(player, "Skill is not passive.");
      }

      skill.activate(player);
    }
  };
};
