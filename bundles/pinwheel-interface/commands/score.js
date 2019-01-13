'use strict';

/**
 * Render a score output for the character
 */
const sprintf = require('sprintf-js').sprintf;

module.exports = (srcPath) => {
  const B = require(srcPath + 'Broadcast');
  const Combat = require(srcPath + 'Combat');
  const Config = require(srcPath + 'Config');

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
          current: p.getAttribute(stat),
          base: p.getAttributeBase(stat),
          max: p.getMaxAttribute(stat),
        };
      }

      // HEADER
      say('');
      let multiArch = '';
      for (let arch of p.archetypes) {
        multiArch += `${arch}-`;
      }
      multiArch = multiArch.slice(0, -1);
      say('<b>' + B.center(60, `${p.name} the ${p.species} ${multiArch}`));
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
      // TABLE HEADERS
      const currencyName = B.capitalize(Config.get('currency', 'cowries'));
      B.at(p,sprintf(`  <b><white>Attributes%12sCombat%15s${currencyName}</white></b>`, ' ', ' '));
      say('');

      // TOPS OF TABLES
      B.at(p, ' .' + B.line(19, '<b>-</b>', 'white') + '.');
      B.at(p, ' .' + B.line(18, '<b>-</b>', 'white') + '.');
      B.at(p, ' .' + B.line(12, '<b>-</b>', 'white') + '.');
      say('');

      // BRAWN
      printStat('brawn', false);

      // WEAPON DAMAGE
      const weaponDamage = Combat.getWeaponDamage(p);
      const min = Combat.normalizeWeaponDamage(p, weaponDamage.min);
      const max = Combat.normalizeWeaponDamage(p, weaponDamage.max);
      const dam = (min + max) / 2
      B.at(p, sprintf(' %-11s: <b>%5s</b> |', '| Wep Dmg ', dam));

      // CURRENCY
      say(sprintf('%1s| <yellow>%10s</yellow> |', '', p.getMeta(Config.get('currency', 'cowries')) || 0));

      // ENDURANCE
      printStat('endurance', false);

      // WEAPON SPEED
      B.at(p, sprintf(' %-11s: <b>%5s</b> |', '| Wep Spd ', Combat.getWeaponSpeed(p)));

      // BOTTOM OF CURRENCY TABLE
      B.at(p, " '" + B.line(12, '<b>-</b>', 'white') + "'");
      say('');

      // REFLEXES
      printStat('reflexes', false);

      // ARMOR
      B.at(p, '');
      printStat('armor', false, 8, 5, true);

      // PERCEPTION
      say('');
      printStat('perception', false);

      // CRITICAL
      B.at(p, '');
      printStat('critical', false, 8, 5, true);
      say('');

      // INTELLECT
      printStat('intellect', false);

      // FATIGUE
      B.at(p, '');
      printStat('fatigue', false, 8, 5, true);

      // EXPERIENCE TABLE HEADER
      B.at(p, '  <b><white>Experience</white></b>');
      say('');

      // CHARISMA
      printStat('charisma', false);

      // BOTTOM OF COMBAT TABLE
      B.at(p, " '" + B.line(18, '<b>-</b>', 'white') + "'");

      // TOP OF EXPERIENCE TABLE
      B.at(p, ' .' + B.line(12, '<b>-</b>', 'white') + '.');
      say('');

      // LUCK
      printStat('luck', false);

      // EXPERIENCE
      say(sprintf('%22s| <magenta>%10s</magenta> |', '', p.getMeta('currencies.experience') || 0));

      // BOTTOM OF ATTRIBUTES TABLE
      B.at(p, " '" + B.line(19, '<b>-</b>', 'white') + "'");

      // BOTTOM OF EXPERIENCE TABLE
      B.at(p, sprintf('%22s', ' ') + "'" + B.line(12, '<b>-</b>', 'white') + "'");
      say('');
    }
  };
};
