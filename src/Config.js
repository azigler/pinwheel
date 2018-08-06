'use strict';

const Data = require('./Data');

let __cache = null;

/**
 * Access class for the `pinwheel.json` config
 */
class Config {
  /**
   * @param {string} key
   * @param {*} fallback fallback value
   */
  static get(key, fallback) {
    if (!__cache) {
      Config.load();
    }

    return key in __cache ? __cache[key] : fallback;
  }

  /**
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
