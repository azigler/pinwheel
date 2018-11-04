'use strict';

/**
 * Helper methods for checking types
 */
class TypeUtil {
  /**
   * Whether a given object adheres to a given interface by checking
   * if `obj` has all methods in `type`
   * @param {object} obj Object to check
   * @param {array} type Array of methods to check for
   * @return {boolean}
   */
  static is(obj, type) {
    for (let method of type) {
      if (!Reflect.has(obj, method)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Whether a given object is iterable
   * @param {object} obj
   * @return {boolean}
   */
  static iterable(obj) {
    return obj && typeof obj[Symbol.iterator] === 'function';
  }
}

module.exports = TypeUtil;
