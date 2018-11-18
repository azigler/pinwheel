'use strict';

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const dataPath = __dirname + '/../data/';

/**
 * Class for loading/parsing data files from disk
 */
class Data {
  /**
   * Read in and parse a file. Current supports yaml and json
   * @param {string} filepath
   * @return {*} parsed contents of file
   */
  static parseFile(filepath) {
    if (!fs.existsSync(filepath)) {
      throw new Error(`File [${filepath}] does not exist!`);
    }

    const contents = fs.readFileSync(fs.realpathSync(filepath)).toString('utf8');
    const parsers = {
      '.yml': yaml.load,
      '.yaml': yaml.load,
      '.json': JSON.parse,
    };

    const ext = path.extname(filepath);
    if (!(ext in parsers)) {
      throw new Error(`File [${filepath}] does not have a valid parser!`);
    }

    return parsers[ext](contents);
  }

  /**
   * Write data to a file
   * @param {string} filepath
   * @param {*} data
   * @param {function} callback
   */
  static saveFile(filepath, data, callback) {
    if (!fs.existsSync(filepath)) {
      throw new Error(`File [${filepath}] does not exist!`);
    }

    const serializers = {
      '.yml': yaml.safeDump,
      '.yaml': yaml.safeDump,
      '.json': function(data) {
        // format the JSON for readability
        return JSON.stringify(data, null, 2);
      }
    };

    const ext = path.extname(filepath);
    if (!(ext in serializers)) {
      throw new Error(`File [${filepath}] does not have a valid serializer!`);
    }

    const dataToWrite = serializers[ext](data);
    fs.writeFileSync(filepath, dataToWrite, 'utf8');

    if (callback) {
      callback();
    }
  }

  /**
   * Load and parse a data file
   * @param {string} type
   * @param {string} id
   * @return {*}
   */
  static load(type, id) {
    return this.parseFile(this.getDataFilePath(type, id));
  }

  /**
   * Save file data to disk
   * @param {string} type
   * @param {string} id
   * @param {*} data
   * @param {function} callback
   */
  static save(type, id, data, callback) {
    fs.writeFileSync(this.getDataFilePath(type, id), JSON.stringify(data, null, 2), 'utf8');
    if (callback) {
      callback();
    }
  }

  /**
   * Save bug file data to disk
   * @param {string} type
   * @param {string} id
   * @param {*} data
   * @param {function} callback
   */
  static saveBug(type, id, data, callback) {
    fs.writeFileSync(this.getDataFilePath(type, id), data);
    if (callback) {
      callback();
    }
  }

  /**
   * Check if a data file exists
   * @param {string} type
   * @param {string} id
   * @return {boolean}
   */
  static exists(type, id) {
    return fs.existsSync(this.getDataFilePath(type, id));
  }

  /**
   * Get the file path for a given data file by type
   * @param {string} type
   * @param {string} id
   * @return {string}
   */
  static getDataFilePath(type, id) {
    switch (type) {
      case 'player': {
        return dataPath + `player/${id}.json`;
      }
      case 'account': {
        return dataPath + `account/${id}.json`;
      }
      case 'bug': {
        return dataPath + `bug/${id}.txt`;
      }
      case 'area': {
        return dataPath + `area/${id}.json`;
      }
    }
  }

  /**
   * Determine whether or not a path leads to a legitimate JS file or not
   * @param {string} path
   * @param {string} [file]
   * @return {boolean}
   */
  static isScriptFile(path, file) {
    file = file || path;
    return fs.statSync(path).isFile() && file.match(/js$/);
  }

  /**
   * Load the Message of the Day (MotD) file
   * @return string
   */
  static loadMotd() {
    const motd = fs.readFileSync(dataPath + 'motd').toString('utf8');
    return motd;
  }
}

module.exports = Data;
