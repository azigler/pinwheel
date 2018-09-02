'use strict';

const RandomUtil = require('./Util/RandomUtil');
const Data = require('./Data');
const Logger = require('./Logger');

// cache pools as they're loaded
let loadedPools = {};

/**
 * Loot is defined as one or more pools that define the chances of being rewarded their contents.
 */
class Loot {
  /**
   * @param {Array<PoolReference|Object>} config.pools List of pool references or definitions
   */
  constructor(state, config) {
    this.pools = config.pools || [];
    this.currencyRanges = config.currencies || null;

    this.options = Object.assign({
      maxItems: 5
    }, config.options || {});

    this.pools = this.pools
      .map(pool => this.resolvePool(state, pool))
      .reduce((acc, val) => acc.concat(val), [])
    ;
  }

  /**
   * Determine what items to give
   * @return {Array<{Item}>}
   */
  items() {
    let items = [];
    for (const pool of this.pools) {
      // if the pool has not been resolved, skip it
      if (!(pool instanceof Map)) {
        continue;
      }

      // stop if the max amount of items have been rolled for
      if (items.length >= this.options.maxItems) {
        break;
      }

      // calculate chance to gain each item in pool
      for (const [item, chance] of pool) {
        if (RandomUtil.probability(chance)) {
          items.push(item);
        }

        // stop if the max amount of items have been rolled for
        if (items.length >= this.options.maxItems) {
          break;
        }
      }
    }

    return items;
  }

  /**
   * Determine how much of the different currencies to give
   * @return {Array<{{name: string, amount: number}}>}
   */
  currencies() {
    if (!this.currencyRanges) {
      return null;
    }

    let result = [];
    for (const currency in this.currencyRanges) {
      const entry = this.currencyRanges[currency];
      const amount = RandomUtil.inRange(entry.min, entry.max);
      if (amount) {
        result.push({
          name: currency,
          amount
        });
      }
    }

    return result;
  }

  /**
   * Load the loot pools
   * @return {Array<{pool}>}
   */
  resolvePool(state, pool) {
    // if the pool is already a Map
    if (typeof pool !== 'string') {
      // then pool is a ready-built pool definition, return it
      return [new Map(Object.entries(pool))];
    }

    // otherwise pool entry is a String like "myarea:mypool" so try to load loot.yml from the appropriate area
    const poolArea = state.AreaManager.getAreaByReference(pool);
    if (!poolArea) {
      Logger.error(`Invalid loot pool area: ${pool}`);
      return null;
    }

    const areaPath = state.AreaManager.getAreaByReference(pool).areaPath;
    const poolsPath = __dirname + '/../bundles/' + areaPath + '/loot.yml';

    // if that pool has not yet been loaded from disk
    if (!loadedPools[poolArea.name]) {
      try {
        // load the pool from disk
        loadedPools[poolArea.name] = Data.parseFile(poolsPath);
      } catch (e) {
        // if there is no loot pool in that area
        return Logger.error(`Area has no loot definition: ${pool} - ${poolsPath}`);
      }
    }

    // get the available pools we just loaded from disk
    let availablePools = loadedPools[poolArea.name];

    // get the specific name of the pool within the area
    const [, poolName] = pool.split(':');

    // check if that pool is defined in that area
    if (!(poolName in availablePools)) {
      Logger.error(`Area does not include loot pool: ${poolName}`);
      return null;
    }

    const resolvedPool = availablePools[poolName];

    // if the resolved pool is just a single pool definition, then return it
    if (!Array.isArray(resolvedPool)) {
      pool = resolvedPool;
    } else {
      // if resolved pool is an array of pools, then recursively resolve it
      pool = resolvedPool
        .map(nestedPool => this.resolvePool(state, nestedPool))
        .reduce((acc, val) => acc.concat(val), [])
      ;
    }

    // return the pool(s)
    return Array.isArray(pool) ? pool : [new Map(Object.entries(pool))];
  }
}

module.exports = Loot;
