'use strict';

/**
 * Representation of a helpfile
 */
class Helpfile {
  /**
   * @param {string}        bundle      Bundle of origin
   * @param {string}        name        Name of helpfile
   * @param {Array<string>} keywords    Keywords for helpfile
   * @param {string}        command     Helpfile's command
   * @param {string}        channel     Helpfile's channel
   * @param {Array<string>} related     Array of names of related helpfiles
   * @param {string}        body        Description text of helpfile
   */
  constructor(bundle, name, def) {
    // validate loaded helpfile
    if (!def || !def.body) {
      throw new Error(`Help file [${name}] has no content.`);
    }

    // assign required properties
    this.bundle = bundle;
    this.name = name;
    this.body = def.body;

    // assign option properties
    this.keywords = def.keywords || [name];
    this.related = def.related || [];

    // set either command or channel for helpfile
    // (will only have one)
    if (def.command) {
      this.command = def.command;
    } if (def.channel) {
      this.channel = def.channel;
    }
  }
}

module.exports = Helpfile;
