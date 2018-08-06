'use strict';

const Broadcast = require('./Broadcast');
const WorldAudience = require('./ChannelAudience/WorldAudience');
const PrivateAudience = require('./ChannelAudience/PrivateAudience');
const PartyAudience = require('./ChannelAudience/PartyAudience');
const RoleAudience = require('./ChannelAudience/RoleAudience');

/**
 * @property {ChannelAudience} audience People who receive messages from this channel
 * @property {string} name  Actual name of the channel the user will type
 * @property {string} color Default color. This is purely a helper if you're using default format methods
 * @property {PlayerRoles} minRequiredRole If set only players with the given role or greater can use the channel
 * @property {string} description
 * @property {{sender: function, target: function}} [formatter]
 */
class Channel {
  /**
   * @param {object}  config
   * @param {string} config.name Name of the channel
   * @param {ChannelAudience} config.audience
   * @param {string} [config.description]
   * @param {PlayerRoles} [config.minRequiredRole]
   * @param {string} [config.color]
   * @param {{sender: function, target: function}} [config.formatter]
   */
  constructor(config) {
    if (!config.name) {
      throw new Error("Channels must have a name to be usable.");
    }
    if (!config.audience) {
      throw new Error(`Channel ${config.name} is missing a valid audience.`);
    }
    this.name = config.name;
    this.description = config.description;
    this.bundle = config.bundle || null; // for debugging purposes, which bundle it came from
    this.audience = config.audience || (new WorldAudience());
    this.color = config.color || null;
    this.aliases = config.aliases;
    this.formatter = config.formatter || {
      sender: this.formatToSender.bind(this),
      target: this.formatToReceipient.bind(this),
    };
  }

  /**
   * @param {GameState} state
   * @param {Player}    sender
   * @param {string}    message
   */
  send(state, sender, message) {

    // If they don't include a message, explain how to use the channel.
    if (!message.length) {
      return this.describeSelf(sender);
    }

    if (!this.audience) {
      throw new Error(`Channel [${this.name} has invalid audience [${this.audience}]`);
    }

    // Check if character has a sufficient role for the channel.
    if (this.audience instanceof RoleAudience && (sender.role < this.audience.minRole)) {
      // effectively hide the channel's command if they lack the minimum role for the channel
      return Broadcast.sayAt(sender, "Huh?");
    }

    this.audience.configure({ state, sender, message });
    const targets = this.audience.getBroadcastTargets();

    if (this.audience instanceof PartyAudience && !targets.length) {
      if (!sender.party) {
        return Broadcast.sayAt(sender, "You aren't in a group.");
      } else {
        return Broadcast.sayAt(sender, "Your group is empty.");
      }
    }

    // Allow audience to change message e.g., strip target name.
    message = this.audience.alterMessage(message);

    // Private channels also send the target player to the formatter
    if (this.audience instanceof PrivateAudience) {
      if (!targets.length) {
        return Broadcast.sayAt(sender, "That person is not connected or does not exist.");
      }
      // stop the user if they try to tell themselves
      if (targets[0] === '_self') {
        return Broadcast.sayAt(sender, "You can't use this command on yourself.");
      }
      Broadcast.sayAt(sender, this.formatter.sender(sender, targets[0], message, this.colorify.bind(this)));
    } else {
      Broadcast.sayAt(sender, this.formatter.sender(sender, null, message, this.colorify.bind(this)));
    }

    // send to audience targets
    Broadcast.sayAtFormatted(this.audience, message, (target, message) => {
      return this.formatter.target(sender, target, message, this.colorify.bind(this));
    });
  }

  describeSelf(sender) {
    Broadcast.sayAt(sender, `\r\nChannel: ${this.name}`);
    Broadcast.sayAt(sender, 'Syntax: ' + this.getUsage());
    if (this.description) {
      Broadcast.sayAt(sender, this.description);
    }
  }

  getUsage() {
    if (this.audience instanceof PrivateAudience) {
      return `${this.name} <target> [message]`;
    }

    return `${this.name} [message]`;
  }

  /**
   * How to render the message the player just sent to the channel
   * E.g., you may want "chat" to say "You chat, 'message here'"
   * @param {Player} sender
   * @param {string} message
   * @param {Function} colorify
   * @return {string}
   */
  formatToSender(sender, target, message, colorify) {
    return colorify(`[${this.name}] ${sender.name}: ${message}`);
  }

  /**
   * How to render the message to everyone else
   * E.g., you may want "chat" to say "Playername chats, 'message here'"
   * @param {Player} sender
   * @param {Player} target
   * @param {string} message
   * @param {Function} colorify
   * @return {string}
   */
  formatToReceipient(sender, target, message, colorify) {
    return this.formatToSender(sender, target, message, colorify);
  }

  colorify(message) {
    if (!this.color) {
      return message;
    }

    const colors = Array.isArray(this.color) ? this.color : [this.color];

    const open = colors.map(color => `<${color}>`).join('');
    const close = colors.reverse().map(color => `</${color}>`).join('');

    return open + message + close;
  }
}

module.exports = Channel;


