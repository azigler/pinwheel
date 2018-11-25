'use strict';

const Config  = require('../Config');

/**
 * Helper methods for validating input
 */
class ValidationUtil {
  /**
   * Whether the provided name string is valid
   * @param {string} name
   * @return {boolean}
   */
  static validateName(name) {
    const maxLength = Config.get('maxNameLength');
    const minLength = Config.get('minNameLength');

    if (!name) {
      return '<red>Please enter a name.</red>';
    }
    if (name.length > maxLength) {
      return '<red>Too long, try a shorter name.</red>';
    }
    if (name.length < minLength) {
      return '<red>Too short, try a longer name.</red>';
    }
    if (!/^[a-z]+$/i.test(name)) {
      return '<red>Your name may only contain A-Z without spaces or special characters.</red>';
    }
    return false;
  }
}

module.exports = ValidationUtil;
