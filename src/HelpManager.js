'use strict';

/**
 * Contain/look up helpfiles
 */
class HelpManager extends Map {
  /**
   * @param {Helpfile} help
   */
  add(help) {
    this.set(help.name, help);
  }

  /**
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
