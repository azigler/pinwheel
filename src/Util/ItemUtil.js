'use strict';

const srcPath = '../'
const sprintf = require('sprintf-js').sprintf;
const ItemType = require(srcPath + 'ItemType');
const B = require(srcPath + 'Broadcast');

/**
 * Helper methods for items
 */
class ItemUtil {
  /**
   * Object of output properties for item qualities
   * @return {Object}
   */
  static qualityColors() {
    return {
      poor: ['bold', 'black'],
      common: ['bold', 'white'],
      uncommon: ['bold', 'green'],
      rare: ['bold', 'blue'],
      epic: ['bold', 'magenta'],
      legendary: ['bold', 'red'],
      artifact: ['yellow']
    }
  }

  /**
   * Colorize the given string according to the provided item's quality
   * @param {Item}    item
   * @param {string}  string
   * @return {string}
   */
  static qualityColorize(item, string) {
    const colors = this.qualityColors()[item.metadata.quality || 'common'];
    const open = '<' + colors.join('><') + '>';
    const close = '</' + colors.reverse().join('></') + '>';
    return open + string + close;
  }

  /**
   * Return an item's room tag colorized by its quality
   * @param {Item}    item
   * @param {string}  string
   * @return {string}
   */
  static display(item) {
    return this.qualityColorize(item, `[${item.name}]`);
  }

  /**
   * Return a display box for an item
   * @param {GameState} state
   * @param {Item}      item
   * @param {Player}    player
   * @return {string}   buffer to be broadcasted
   */
  static renderItem(state, item, player) {
    // TOP OF BOX
    let buf = this.qualityColorize(item, '.' + B.line(38) + '.') + '\r\n';

    // ITEM NAME
    buf += '| ' + this.qualityColorize(item, sprintf('%-36s', item.name)) + ' |\r\n';

    // pull metadata from the item
    const props = item.metadata;

    // WEARABLE OR WEAPON
    buf += sprintf('| %-36s |\r\n', item.type === ItemType.WEARABLE ? 'Wearable' : 'Weapon');

    // ITEM TYPE PROPERTIES
    switch (item.type) {
      case ItemType.WEAPON:
        buf += sprintf('| %-34s   %-33s   %-27s |\r\n', `<b><red>${props.minDamage} - ${props.maxDamage} Damage</red></b>`, `<b><magenta>${B.capitalize(props.type)}</magenta></b>`, `<b><cyan>Lag ${props.lag}</cyan></b>`);
        break;
      case ItemType.WEARABLE:
        buf += sprintf('| %-36s |\r\n', item.metadata.slot[0].toUpperCase() + item.metadata.slot.slice(1));
        break;
      case ItemType.CONTAINER:
        buf += sprintf('| %-36s |\r\n', `Holds ${item.maxItems} items`);
        break;
    }

    // copy stats to ensure we don't accidentally modify anything
    const stats = Object.assign({}, props.stats);

    // ARMOR
    if (stats.armor) {
      buf += sprintf('| %-58s |\r\n', `<b><green>${stats.armor} Armor</green></b>`);
      delete stats.armor;
    }

    // NON-ARMOR STATS
    for (const stat in stats) {
      const value = stats[stat];
      buf += sprintf(
        '| %-58s |\r\n',
        `<b><green>${(value > 0 ? '+' : '') + value + ' ' + stat[0].toUpperCase() + stat.slice(1)}</green></b>`
      );
    }

    // ON USE
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

    // BOTTOM OF BOX
    buf += this.qualityColorize(item, "'" + B.line(38) + "'") + '\r\n';

    // colorize border according to item quality
    buf = buf.replace(/\|/g, this.qualityColorize(item, '|'));

    // return the display buffer
    return buf;
  }
}

module.exports = ItemUtil;
