'use strict';

/**
 * Item utility functions
 */

const srcPath = '../'

const sprintf = require('sprintf-js').sprintf;
const ItemType = require(srcPath + 'ItemType');
const B = require(srcPath + 'Broadcast');

// TODO: update item qualities
const qualityColors = {
  poor: ['bold', 'black'],
  common: ['bold', 'white'],
  uncommon: ['bold', 'green'],
  rare: ['bold', 'blue'],
  epic: ['bold', 'magenta'],
  legendary: ['bold', 'red'],
  artifact: ['yellow'],
};
exports.qualityColors = qualityColors;

/**
 * Colorize the given string according to this item's quality
 * @param {Item} item
 * @param {string} string
 * @return string
 */
function qualityColorize(item, string) {
  const colors = qualityColors[item.metadata.quality || 'common'];
  const open = '<' + colors.join('><') + '>';
  const close = '</' + colors.reverse().join('></') + '>';
  return open + string + close;
}
exports.qualityColorize = qualityColorize;

/**
 * Friendly display colorized by quality
 */
exports.display = function (item) {
  return qualityColorize(item, `[${item.name}]`);
};

/**
 * Render a pretty display of an item
 * @param {GameState} state
 * @param {Item}      item
 * @param {Player}    player
 */
exports.renderItem = function (state, item, player) {
  // TODO: refactor and comment
  let buf = qualityColorize(item, '.' + B.line(38) + '.') + '\r\n';
  buf += '| ' + qualityColorize(item, sprintf('%-36s', item.name)) + ' |\r\n';

  const props = item.metadata;

  buf += sprintf('| %-36s |\r\n', item.type === ItemType.WEARABLE ? 'WEARABLE' : 'Weapon');

  switch (item.type) {
    case ItemType.WEAPON:
      buf += sprintf('| %-40s%34s |\r\n', `<b><red>${props.minDamage} - ${props.maxDamage} Damage</red></b>`, `<b><cyan>Lag ${props.lag}</cyan></b>`);
      break;
    case ItemType.WEARABLE:
      buf += sprintf('| %-36s |\r\n', item.metadata.slot[0].toUpperCase() + item.metadata.slot.slice(1));
      break;
    case ItemType.CONTAINER:
      buf += sprintf('| %-36s |\r\n', `Holds ${item.maxItems} items`);
      break;
  }

  // copy stats to make sure we don't accidentally modify it
  const stats = Object.assign({}, props.stats);

  // always show armor first
  if (stats.armor) {
    buf += sprintf('| %-58s |\r\n', `<b><green>${stats.armor} Armor</green></b>`);
    delete stats.armor;
  }

  // then show non-armor stats
  for (const stat in stats) {
    const value = stats[stat];
    buf += sprintf(
      '| %-58s |\r\n',
      `<b><green>${(value > 0 ? '+' : '') + value + ' ' + stat[0].toUpperCase() + stat.slice(1)}</green></b>`
    );
  }

  // custom special effect rendering
  // TODO: this is currently unused... what is this?
  if (props.specialEffects) {
    props.specialEffects.forEach(effectText => {
      const text = B.wrap(effectText, 36).split(/\r\n/g);
      text.forEach(textLine => {
        buf += sprintf('| <b><green>%-36s</green></b> |\r\n', textLine);
      });
    });
  }

  // On use
  const usable = item.getBehavior('usable');
  if (usable) {
    if (usable.spell) {
      const useSpell = state.SpellManager.get(usable.spell);
      if (useSpell) {
        useSpell.options = usable.options;
        buf += B.wrap('<b>On Use</b>: ' + useSpell.info(player), 80) + '\r\n';
      }
    }

    if (usable.effect && usable.config.description) {
      buf += B.wrap('<b>Effect</b>: ' + usable.config.description, 80) + '\r\n';
    }

    if (usable.charges) {
      buf += B.wrap(`${usable.charges} Charges`, 80) + '\r\n';
    }
  }

  // colorize border according to item quality
  buf = buf.replace(/\|/g, qualityColorize(item, '|'));
  return buf;
};
