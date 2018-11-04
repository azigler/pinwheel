'use strict';

const ansi = require('sty');
ansi.enable(); // force ansi on even when there isn't a tty for the server
const wrap = require('wrap-ansi');
const TypeUtil = require('./Util/TypeUtil');
const Broadcastable = require('./Broadcastable');

/**
 * Utility functions for sending all output to a player
 */
class Broadcast {
  /**
   * @param {Broadcastable}   source    Target source for the message (e.g., Room, Party, Player)
   * @param {string}          message   The message to be broadcasted
   * @param {?number|Boolean} wrapWidth Width to wrap the message, or false to not wrap at all
   * @param {?Boolean}        useColor  Whether to parse color tags in the message
   * @param {?function(target, message): string} formatter Function to call to format the message to each target
   */
  static at(source, message = '', wrapWidth = false, useColor = true, formatter = null) {
    // validate useColor and formatter
    useColor = typeof useColor === 'boolean' ? useColor : true;
    formatter = formatter || ((target, message) => message);

    // if the source does not implement Broadcastable
    if (!TypeUtil.is(source, Broadcastable)) {
      throw new Error(`Tried to broadcast message not non-broadcastable object: MESSAGE [${message}]`);
    }

    // fix newlines
    message = Broadcast._fixNewlines(message);

    // get targets from source
    const targets = source.getBroadcastTargets();
    targets.forEach(target => {
      if (target.socket && target.socket.writable) {
        if (target.socket._prompted) {
          target.socket.write('\r\n');
          target.socket._prompted = false;
        }
        let targetMessage = formatter(target, message);
        targetMessage = wrapWidth ? Broadcast.wrap(targetMessage, wrapWidth) : ansi.parse(targetMessage);
        // broadcast message to target
        target.socket.write(targetMessage);
      }
    });
  }

  /**
   * Wrapper around `Broadcast.at` with a newline
   * @see {@link Broadcast#at}
   * 
   * @param {Broadcastable}   source    Target source for the message (e.g., Room, Party, Player)
   * @param {string}          message   The message to be broadcasted
   * @param {?number|Boolean} wrapWidth Width to wrap the message, or false to not wrap at all
   * @param {?Boolean}        useColor  Whether to parse color tags in the message
   * @param {?function(target, message): string} formatter Function to call to format the message to each target
   */
  static sayAt(source, message, wrapWidth, useColor, formatter) {
    Broadcast.at(source, message, wrapWidth, useColor, (target, message) => {
      return (formatter ? formatter(target, message) : message ) + '\r\n';
    });
  }

  /**
   * Wrapper around `Broadcast.at` for all except given Array of players
   * @see {@link Broadcast#at}
   * 
   * @param {Broadcastable}   source    Target source for the message (e.g., Room, Party, Player)
   * @param {string}          message   The message to be broadcasted
   * @param {Player|Array<Player>} excludes Player or Array of players to exclude from the broadcast
   * @param {?number|Boolean} wrapWidth Width to wrap the message, or false to not wrap at all
   * @param {?Boolean}        useColor  Whether to parse color tags in the message
   * @param {?function(target, message): string} formatter Function to call to format the message to each target
   */
  static atExcept(source, message, excludes, wrapWidth, useColor, formatter) {
    // Could be an array or a single target.
    excludes = [].concat(excludes);

    const targets = source.getBroadcastTargets()
      .filter(target => !excludes.includes(target));

    const newSource = {
      getBroadcastTargets: () => targets
    };

    Broadcast.at(newSource, message, wrapWidth, useColor, formatter);
  }

  /**
   * Wrapper around `Broadcast.atExcept` with a newline
   * @see {@link Broadcast#atExcept}
   * 
   * @param {Broadcastable}   source    Target source for the message (e.g., Room, Party, Player)
   * @param {string}          message   The message to be broadcasted
   * @param {Player|Array<Player>} excludes Player or Array of players to exclude from the broadcast
   * @param {?number|Boolean} wrapWidth Width to wrap the message, or false to not wrap at all
   * @param {?Boolean}        useColor  Whether to parse color tags in the message
   * @param {?function(target, message): string} formatter Function to call to format the message to each target
   */
  static sayAtExcept(source, message, excludes, wrapWidth, useColor, formatter) {
    Broadcast.atExcept(source, message, excludes, wrapWidth, useColor, (target, message) => {
      return (formatter ? formatter(target, message) : message ) + '\r\n';
    });
  }

  /**
   * Render a player's prompt, including any extra prompts
   * @param {Player}  player    Target for rendering prompt(s)
   * @param {object}  extra     Extra data to for the prompt string interpolator
   * @param {number}  wrapWidth Width to wrap the message
   * @param {Boolean} useColor  Whether to parse color tags in the message
   */
  static prompt(player, extra, wrapWidth, useColor) {
    player.socket._prompted = false;

    // display interpolated main prompt
    Broadcast.at(player, '\r\n' + player.interpolatePrompt(player.prompt, extra) + ' ', wrapWidth, useColor);

    // add newline if player has more prompts
    let needsNewline = player.extraPrompts.size > 0;
    if (needsNewline) {
      Broadcast.sayAt(player);
    }

    // print each extra prompt
    for (const [id, extraPrompt] of player.extraPrompts) {
      Broadcast.sayAt(player, extraPrompt.renderer(), wrapWidth, useColor);
      if (extraPrompt.removeOnRender) {
        player.removePrompt(id);
      }
    }

    // add newline if needed
    if (needsNewline) {
      Broadcast.at(player);
    }

    player.socket._prompted = true;
    if (player.socket.writable) {
      player.socket.command('goAhead');
    }
  }

  /**
   * Generate an ASCII art progress bar
   * @param {number} width      Maximum width for the progress bar
   * @param {number} percent    Current percentage for the progress bar
   * @param {string} color      Color of the progress bar
   * @param {string} barChar    String character to use for the current progress
   * @param {string} fillChar   String character to use for the remaining space
   * @param {string} delimiters String characters for either end of the progress bar
   * @return {string}
   */
  static progress(width, percent, color, barChar = "#", fillChar = " ", delimiters = "()") {
    // validate percent
    percent = Math.max(0, percent);

    // account for delimiters and tip of bar
    width -= 3;

    // if at 100% or beyond
    if (percent >= 100) {
        // a full progress bar doesn't have a second right delimiter
        width++;
    }
    
    // set string characters
    barChar = barChar[0];
    fillChar = fillChar[0];
    const [ leftDelim, rightDelim ] = delimiters;

    // set color
    const openColor = `<${color}>`;
    const closeColor = `</${color}>`;
    
    // build progress bar
    let buf = openColor + leftDelim + "<bold>";
    const widthPercent = Math.round((percent / 100) * width);
    // fill buffer with progress and remove second right delimeter if at 100% or beyond
    buf += Broadcast.line(widthPercent, barChar) + (percent >= 100 ? '' : rightDelim);
    // fill progress bar with remaining space
    buf += Broadcast.line(width - widthPercent, fillChar);
    // close progress bar
    buf += "</bold>" + rightDelim + closeColor;
    
    // return progress bar
    return buf;
  }

  /**
   * Capitalize a message
   * @param {string}  message
   * @return {string}
   */
  static capitalize(message) {
    if (typeof message === 'string') {
      const [first, ...rest] = message;
      return `${first.toUpperCase()}${rest.join('')}`;
    } else {
      return message;
    }
  }

  /**
   * Center a string in the middle of a given width
   * @param {number}  width
   * @param {string}  message
   * @param {string}  color
   * @param {?string} fillChar Character for padding
   * @return {string}
   */
  static center(width, message, color, fillChar = " ") {
    const padWidth = width / 2 - message.length / 2;
    let openColor = '';
    let closeColor = '';
    if (color) {
      openColor = `<${color}>`;
      closeColor = `</${color}>`;
    }

    return (
      openColor +
      Broadcast.line(Math.floor(padWidth), fillChar) +
      message +
      Broadcast.line(Math.ceil(padWidth), fillChar) +
      closeColor
    );
  }

  /**
   * Render a line of a specific width and color
   * @param {number} width
   * @param {string} fillChar
   * @param {?string} color
   * @return {string}
   */
  static line(width, fillChar = "-", color = null) {
    let openColor = '';
    let closeColor = '';
    if (color) {
      openColor = `<${color}>`;
      closeColor = `</${color}>`;
    }
    if (width < 0) { width = 0 };
    return openColor + (new Array(width + 1)).join(fillChar) + closeColor;
  }

  /**
   * Wrap a message to a given width
   * (evaluates color tags)
   * @param {string}  message
   * @param {?number} width    defaults to 80
   * @return {string}
   */
  static wrap(message, width = 80) {
    return Broadcast._fixNewlines(wrap(ansi.parse(message), width));
  }

  /**
   * Indent all lines of a given string by a given amount
   * @param {string} message
   * @param {number} indent
   * @return {string}
   */
  static indent(message, indent) {
    message = Broadcast._fixNewlines(message);
    const padding = Broadcast.line(indent, ' ');
    return padding + message.replace(/\r\n/g, '\r\n' + padding);
  }

  /**
   * Fix LF unpaired with CR for windows output
   * @param {string} message
   * @return {string}
   * @private
   */
  static _fixNewlines(message) {
    // Fix \n not in a \r\n pair to prevent bad rendering on windows
    message = message.replace(/\r\n/g, '<NEWLINE>').split('\n');
    message = message.join('\r\n').replace(/<NEWLINE>/g, '\r\n');
    // fix sty's incredibly stupid default of always appending ^[[0m
    return message.replace(/\x1B\[0m$/, '');
  }
}

module.exports = Broadcast;
