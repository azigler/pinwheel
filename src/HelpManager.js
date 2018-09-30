'use strict';

/**
 * Keep track of helpfiles
 */
class HelpManager extends Map {
  /**
   * Add a helpfile
   * @param {Helpfile} help
   */
  add(help) {
    this.set(help.name, help);
  }

  /**
   * Find a helpfile by query string
   * @param {string} search
   * @return {Help}
   */
  find(search) {
    const results = new Map();
    for (const [ name, help ] of this.entries()) {
      if (name.indexOf(search) === 0) {
        results.set(name, help);
        continue;
      }
      if (help.keywords.some(keyword => keyword.includes(search))) {
        results.set(name, help);
      }
    }
    return results;
  }
}

module.exports = HelpManager;
