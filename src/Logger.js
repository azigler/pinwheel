'use strict';

const winston = require('winston');
const chalk = require('chalk');

// reset Console transport and configure to include timestamp
winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {
  'timestamp': function() {
    // declare timestamp for log
    const now = new Date().toLocaleDateString('en-US', {  
      day : 'numeric',
      month : 'short',
      hour : 'numeric',
      minute : 'numeric',
      second: 'numeric'
    });
    return `${chalk.italic.magenta(now)}`;
  }
});

const logDir = __dirname + '/../data/log/';
const logExt = '.log';

/**
 * Wrapper around Winston
 */
class Logger {

  /**
   * Get current log level
   * @return {string}
   */
  static getLevel() {
    return winston.level || process.env.LOG_LEVEL || 'debug';
  }

  /**
   * Set current log level
   * @param {string} level
   */
  static setLevel(level) {
    winston.level = level;
  }

  /**
   * Highest priority logging
   * TIP: appends red "ERROR" to the start of logs
   * @param {Array<string} messages
   */
  static error(...messages) {
    winston.log('error', ...messages);
  }

  /**
   * Less high priority than error, still higher visibility than default
   * @param {Array<string} messages
   */
  static warn(...messages) {
    winston.log('warn', ...messages);
  }

  /**
   * Medium priority logging (default)
   * @param {Array<string} messages
   */
  static log(...messages) {
    winston.log('info', ...messages);
  }

  /**
   * Lower priority logging
   * TIP: only logs if the environment variable is set to `VERBOSE`
   * @param {Array<string} messages
   */
  static verbose(...messages) {
    winston.log('verbose', ...messages);
  }

  /**
   * Start logging to a file
   * @param {string} filename
   */
  static setFileLogging(filename) {
    filename = logDir + filename;
    if (!filename.endsWith(logExt)) {
      filename += logExt;
    }
    console.log(`${chalk.bgMagenta.bold('[LOG] Starting log file:' + filename)}`);
    winston.add(winston.transports.File, { filename, timestamp: true });
  }

  /**
   * Stop logging to a file
   */
  static deactivateFileLogging() {
    winston.remove(winston.transports.File);
  }

  /**
   * Enable prettified console stack trace errors
   */
  static enablePrettyErrors() {
    const pe = require('pretty-error').start();
    pe.skipNodeFiles(); // ignore native Node files in stack trace
  }

}

module.exports = Logger;
