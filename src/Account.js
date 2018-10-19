'use strict';
const bcrypt = require('bcryptjs');
const Data   = require('./Data');

/**
 * Representation of a player's account
 *
 * @property {String}     username         Player's username
 * @property {Array<Object>} characters    Array of this account's characters and their active status
 * @property {String}     password         Hashed password
 * @property {Boolean}    active           Whether this account is active
 * @property {Boolean}    banned           Whether this account is banned
 * 
 * @mixes Metadatable
 */
class Account {
  constructor(data) {
    this.username = data.username;
    this.characters = data.characters || [];
    this.password = data.password;
    this.active = data.active || true;
    this.banned = data.banned || false;

    // Arbitrary data bundles are free to shove whatever they want in
    // WARNING: values must be JSON.stringify-able
    this.metadata = data.metadata || {};
  }

  /**
   * Create a hashed password from a provided password string
   * @private
   * @param {String} password
   * @return {String} Hashed password
   */
  _hashPassword(password) {
    const salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(password, salt);
  }

  /**
   * Return this account's username
   * @return {String} username
   */
  getUsername() {
    return this.username;
  }

  /**
   * Add an object representing a character to this account
   * @param {String} name character's name
   */
  addCharacter(name) {
    this.characters.push({ name: name, active: true});
  }

  /**
   * Whether this account has a specifically named character
   * @param {String} name character's name
   * @return {boolean}
   */
  hasCharacter(name) {
    return this.characters.find(c => c.name === name);
  }

  /**
   * Toggle a character on this account as inactive
   * @param {String} name character's name
   */
  deactivateCharacter(name) {
    var picked = this.characters.find(c => c.name === name);
    picked.active = false;
    this.save();
  }

  /**
   * Toggle a character on this account as active
   * @param {string} name character's name
   */
  activateCharacter(name) {
    var picked = this.characters.find(c => c.name === name);
    picked.active = false;
    this.save();
  }

  /**
   * Set a hashed password for this account based on a provided string
   * @param {String} password Unhashed password
   */
  setPassword(password) {
    this.password = this._hashPassword(password);
    this.save();
  }

  /**
   * Check provided password against this account's hashed password
   * @param {String} password Unhashed password to check against this account's password
   * @return {Boolean}
   */
  checkPassword(password) {
    return bcrypt.compareSync(password, this.password);
  }

  /**
   * Save the account to disk
   * @param {function} callback
   */
  save(callback) {
    Data.save('account', this.username, this.serialize(), callback);
  }

  /**
   * Toggle this account to be banned
   */
  ban() {
    this.banned = true;
    this.save();
  }

  /**
   * Toggle this account to be unbanned
   */
  unban() {
    this.banned = false;
    this.save();
  }

  /**
   * Toggle this account as inactive
   */
  deactivateAccount() {
    this.characters.forEach(char => {
      this.deactivateCharacter(char.name);
    });
    this.active = false;
    this.save();
  }

  /**
   * Toggle this account as active
   */
  activateAccount() {
    this.active = true;
    this.save();
  }

  /**
   * Gather data to be persisted
   * @return {Object}
   */
  serialize() {
    let data = {
      username: this.username,
      characters: this.characters,
      password: this.password,
      active: this.active,
      banned: this.banned,
      metadata: this.metadata
    };

    return data;
  }
}

module.exports = Account;
