'use strict';

const Data = require('./Data');

let __cache = null;

/**
 * Access class for the `pinwheel.json` config
 */
class Config {
  /**
   * Get a configuration property
   * @param {string} key
   * @param {*} fallback fallback value
   */
  static get(key, fallback) {
    if (!__cache || key === 'aspects') {
      Config.load();
    }

    return key in __cache ? __cache[key] : fallback;
  }

  /**
   * Set a configuration property
   * @param {string} key
   * @param {*} val
   */
  static set(key, val) {
    if (!__cache) {
      Config.load();
    }

    __cache[key] = val;
  }

  /**
   * Get all configuration properties
   * @return {Object}
   */
  static getAll() {
    if (!__cache) {
      Config.load();
    }

    return __cache;
  }

  /**
   * Load `pinwheel.json` from disk
   */
  static load() {
    __cache = Data.parseFile(__dirname + '/../pinwheel.json');
  }

  /**
   * Persist changes to config to disk
   * @param {Object} config
   */
  static save(config) {
    config = Object.assign(this.getAll(), config);
    Data.saveFile(__dirname + '/../pinwheel.json', config);
  }
}

module.exports = Config;
