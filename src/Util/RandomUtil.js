'use strict';

const { Random } = require('rando-js');
const Broadcast = require('../Broadcast');

/**
 * Helper methods for randomization by wrapping rando-js
 * See {@link https://github.com/seanohue/rando} for documentation.
 */
class RandomUtil extends Random {
  /**
   * Whether a given percent chance occurs
   * @param {number} percentChance a 0-100 number representing % success chance
   * @return {boolean}
   */
  static probability(percentChance) {
    const rand = Math.random();
    const target = percentChance / 100;
    return target >= rand;
  }
}

module.exports = RandomUtil;
