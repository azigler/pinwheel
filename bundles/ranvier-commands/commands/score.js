'use strict';

// TODO: iterate over again, multiple passes likely needed

const sprintf = require('sprintf-js').sprintf;

module.exports = (srcPath) => {
  const B = require(srcPath + 'Broadcast');
  const Combat = require(srcPath + 'Combat');
  const LevelUtil = require(srcPath + './Util/LevelUtil');

  return {
    aliases: [ 'stats' ],
    command : (state) => (args, p) => {
      // shortcut for printing output
      const say = message => B.sayAt(p, message);

      // print a formatted stat
      const printStat = (stat, newline = true, leftWidth = 10, rightWidth = 4, frontDelimeter = true) => {
        const val = stats[stat];
        const statColor = (val.current > val.base ? 'green' : 'white');
        const front = (frontDelimeter ? `|` : ``)
        const str = sprintf(
          ` ${front} %-${leftWidth}s : <b><${statColor}>%${rightWidth}s</${statColor}></b> |`,
          stat[0].toUpperCase() + stat.slice(1),
          val.current
        );

        if (newline) {
          say(str);
        } else {
          B.at(p, str);
        }
      };

      // get attributes from player to use in score
      let stats = {};
      function getAttributes(value, key, map) {
        stats[`${key}`] = 0;
      }
      p.attributes.forEach(getAttributes);

      for (const stat in stats) {
        stats[stat] = {
          current: p.getAttribute(stat) || 0,
          base: p.getBaseAttribute(stat) || 0,
          max: p.getMaxAttribute(stat) || 0,
        };
      }

      // HEADER
      say('<b>' + B.center(60, `NAME : ${p.name}  -  LEVEL : ${p.level}  -  CLASS : ${p.playerClass.config.name}`, 'white'));
      say('<b>' + B.line(60, '-', 'white'));

      // HEALTH
      B.at(p, sprintf(' %10s: %15s', 'Health ', `<bold><red>${stats.health.current}</red></bold>/<bold><red>${stats.health.max}</red></bold>`));

      // DETERMINE ENERGY BUFFER
      const buffer = `${stats.health.current}/${stats.health.max}`.length;
      if (buffer < 17) {
        B.at(p, sprintf(` %${17-buffer}s`, ' '));
      } else {
        B.at(p, sprintf(' %17s', ' '));
      }

      // ENERGY
      say(sprintf(' %0s: %15s', 'Energy ', `<bold><yellow>${stats.energy.current}</yellow></bold>/<bold><yellow>${stats.energy.max}</yellow></bold>`));
      B.at(p, sprintf(' %3s', ' '));

      // MANA
      if (stats.mana) {
        B.at(p, sprintf(' %6s: %15s', 'Mana ', `<bold><blue>${stats.mana.current}</blue></bold>/<bold><blue>${stats.mana.max}</blue></bold>`));
        B.at(p, sprintf(' %11s', ' '));
      }
      // FAVOR
      if (stats.favor) {
        say(sprintf(' %0s: %15s', 'Favor ', `<bold><green>${stats.favor.current}</green></bold>/<bold><green>${stats.favor.max}</green></bold>`));
      }

      say('');
      say('');
      // TABLE HEADERS
      B.at(p,sprintf('  <b><white>Attributes%12sCombat%15sCowries</white></b>', ' ', ' '));
      say('');

      // TOPS OF TABLES
      B.at(p, ' .' + B.line(19, '<b>-</b>', 'white') + '.');
      B.at(p, ' .' + B.line(18, '<b>-</b>', 'white') + '.');
      B.at(p, ' .' + B.line(12, '<b>-</b>', 'white') + '.');
      say('');

      // BRAWN
      printStat('brawn', false);

      // WEAPON DAMAGE
      const weaponDamage = Combat.getWeaponDamage(p, false);
      const min = Combat.normalizeWeaponDamage(p, weaponDamage.min, true);
      const max = Combat.normalizeWeaponDamage(p, weaponDamage.max, true);
      const dam = (min + max) / 2
      B.at(p, sprintf(' %-11s: <b>%5s</b> |', '| Wep Dmg ', dam));

      // COWRIES
      say(sprintf('%1s| <yellow>%10s</yellow> |', '', p.getMeta('currencies.cowries') || 0));

      // ENDURANCE
      printStat('endurance', false);

      // WEAPON SPEED
      B.at(p, sprintf(' %-11s: <b>%5s</b> |', '| Wep Spd ', Combat.getWeaponSpeed(p, false)));

      // BOTTOM OF COWRIES TABLE
      B.at(p, " '" + B.line(12, '<b>-</b>', 'white') + "'");
      say('');

      // REFLEXES
      printStat('reflexes', false);

      // DEFENSE
      B.at(p, '');
      printStat('defense', false, 8, 5, true);

      // INFLUENCE TABLE HEADER
      B.at(p, '  <b><white>Influence</white></b>');
      say('');

      // PERCEPTION
      printStat('perception', false);

      // CRITICAL
      B.at(p, '');
      printStat('critical', false, 8, 5, true);

      // TOP OF INFLUENCE TABLE
      B.at(p, ' .' + B.line(12, '<b>-</b>', 'white') + '.');
      say('');

      // INTELLECT
      printStat('intellect', false);

      // FATIGUE
      B.at(p, '');
      printStat('fatigue', false, 8, 5, true);

      // INFLUENCE
      say(sprintf('%1s| <magenta>%10s</magenta> |', '', p.getMeta('currencies.influence') || 0));

      // CHARISMA
      printStat('charisma', false);

      // BOTTOM OF COMBAT TABLE
      B.at(p, " '" + B.line(18, '<b>-</b>', 'white') + "'");

      // BOTTOM OF INFLUENCE TABLE
      B.at(p, " '" + B.line(12, '<b>-</b>', 'white') + "'");
      say('');

      // LUCK
      printStat('luck', false);

      // EXPERIENCE PERCENTAGE
      const totalTnl = LevelUtil.expToLevel(p.level + 1);
      const currentPerc = p.experience ? Math.floor((p.experience / totalTnl) * 100) : 0;
      B.at(p, `  Exp: <b><white>${p.experience}</white></b>/<b><white>${totalTnl}</white></b> (<b><white>${totalTnl - p.experience} tnl</white></b>)`);
      say('');

      // BOTTOM OF ATTRIBUTES TABLE
      B.at(p, " '" + B.line(19, '<b>-</b>', 'white') + "'");

      // EXPERIENCE TNL
      say(' ' + B.progress(20, currentPerc, "cyan"));
      say('');
    }
  };
};
