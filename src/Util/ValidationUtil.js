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
      return '<b><yellow>Please enter a name.</yellow></b>';
    }
    if (name.length > maxLength) {
      return '<b><yellow>Too long, try a shorter name.</yellow></b>';
    }
    if (name.length < minLength) {
      return '<b><yellow>Too short, try a longer name.</yellow></b>';
    }
    if (!/^[a-z]+$/i.test(name)) {
      return '<b><yellow>Your name may only contain A-Z without spaces or special characters.</yellow></b>';
    }
    return false;
  }
}

module.exports = ValidationUtil;
