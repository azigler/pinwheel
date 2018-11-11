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
      return 'Please enter a name.';
    }
    if (name.length > maxLength) {
      return 'Too long, try a shorter name.';
    }
    if (name.length < minLength) {
      return 'Too short, try a longer name.';
    }
    if (!/^[a-z]+$/i.test(name)) {
      return 'Your name may only contain A-Z without spaces or special characters.';
    }
    return false;
  }
}

module.exports = ValidationUtil;
