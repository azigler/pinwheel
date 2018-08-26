'use strict';

module.exports = (srcPath) => {
  const B = require(srcPath + 'Broadcast');
  const Logger = require(srcPath + 'Logger');
  const Combat = require(srcPath + 'Combat');
  const CombatErrors = require(srcPath + 'Error/CombatErrors');

  return {
    aliases: ['attack', 'slay'],
    command : (state) => (args, player) => {
      args = args.trim();

      if (!args.length) {
        return B.sayAt(player, 'Kill whom?');
      }

      let target = null;
      try {
        target = Combat.findCombatant(player, args);
      } catch (e) {
        if (
          e instanceof CombatErrors.CombatSelfError ||
          e instanceof CombatErrors.CombatNonPvpError ||
          e instanceof CombatErrors.CombatInvalidTargetError ||
          e instanceof CombatErrors.CombatPacifistError
        ) {
          return B.sayAt(player, e.message);
        }

        Logger.error(e.message);
      }

      if (!target) {
        return B.sayAt(player, `They aren't here.`);
      }

      B.sayAt(player, `<bold><yellow>You attack <magenta>${target.name}</magenta></bold>!</yellow>`);

      player.initiateCombat(target);
      B.sayAtExcept(player.room, `<bold><yellow>${player.name} attacks <magenta>${target.name}</magenta></bold>!</yellow>`, [player, target]);
      if (!target.isNpc) {
        B.sayAt(target, `<bold><magenta>${player.name}</magenta><yellow> attacks you</bold>!</yellow>`);
      }
    }
  };
};
