'use strict';

module.exports = srcPath => {
  const B = require(srcPath + 'Broadcast');
  const Logger = require(srcPath + 'Logger');
  const Combat = require(srcPath + 'Combat');
  const CombatErrors = require(srcPath + 'Error/CombatErrors');

  return {
    usage: 'consider <target>',
    command: state => (args, player) => {
      if (!args || !args.length) {
        return B.sayAt(player, 'Consider whom?');
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

      // TODO: properly assess the target's threat level
      const description = `You conclude nothing about how threatening <bold><yellow>${target.name}</yellow></bold> is to you.`;

      B.sayAt(player, description);
    }
  };
};
