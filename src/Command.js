'use strict';

const CommandType = require('./CommandType');
const PlayerRole = require('./PlayerRole');

/**
 * Representation of an input command
 * 
 * @property {string}       name        Name of command
 * @property {string}       bundle      Bundle of origin
 * @property {CommandType}  type        Command type
 * @property {function}     func        Function to run when command is executed
 * @property {Array<string>} aliases    Array of aliases for command
 * @property {string}       usage       Syntax instructions for command
 * @property {PlayerRole}   requiredRole Minimum player role needed to use command
 * @property {string}       file        Path of the command file (for hotfix)
 */
class Command {
  constructor(bundle, name, def, file) {
    // assign required properties
    this.name = name;
    this.bundle = bundle;
  
    // assign command type
    this.type = typeof def.type === 'string' ? CommandType[def.type] : (def.type || CommandType.COMMAND);
    
    // assign command function
    this.func = def.command;

    // assign aliases for this command
    this.aliases = def.aliases;
    this.usage = def.usage || this.name;

    // set minimum player role for this command
    this.requiredRole = def.requiredRole || PlayerRole.PLAYER;

    // set file path (for hotfix)
    // TODO: warmbooting
    this.file = file;
  }

  /**
   * Execute the command
   * @param {string}    args    String representing anything supplied after the command itself
   * @param {Character} character Character that executed the command
   * @param {string}    arg0    The actual command string supplied, useful when checking which alias was used for a command
   * @return {*}
   */
  execute(args, character, arg0) {
    return this.func(args, character, arg0);
  }
}

module.exports = Command;
