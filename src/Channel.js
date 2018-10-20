'use strict';

const Broadcast = require('./Broadcast');
const WorldAudience = require('./ChannelAudience/WorldAudience');
const PrivateAudience = require('./ChannelAudience/PrivateAudience');
const PartyAudience = require('./ChannelAudience/PartyAudience');
const RoleAudience = require('./ChannelAudience/RoleAudience');

/**
 * Representation of a communication channel
 * 
 * @property {string}           name        Actual name of the channel the user will type
 * @property {ChannelAudience}  audience    People who receive messages from this channel
 * @property {string}           description Description for the channel
 * @property {string}           color       Default color for channel text
 * @property {string}           bundle      Bundle of origin
 * @property {Array|string}     aliases     Aliases for channel
 * @property {{sender: function, target: function}} [formatter] Formatting functions
 */
class Channel {
  constructor(config) {
    // validate config
    const required = ['name', 'audience', 'description'];
    for (const prop of required) {
      if (!(prop in config)) {
        throw new ReferenceError(`Channel [${config.name || 'NO-NAME'}] missing required property: ${prop}`);
      }
    }

    // assign required properties
    this.name = config.name;
    this.audience = config.audience;
    this.description = config.description;

    this.color = config.color || null;
    this.bundle = config.bundle || null;
    this.aliases = config.aliases || null;

    // bind formatting functions  
    this.formatter = config.formatter || {
      sender: this.formatToSender.bind(this),
      target: this.formatToRecipient.bind(this),
    };
  }

  /**
   * Message coloring helper function
   * @param {string}    message
   */
  colorify(message) {
    if (!this.color) {
      return message;
    }

    const colors = Array.isArray(this.color) ? this.color : [this.color];

    const open = colors.map(color => `<${color}>`).join('');
    const close = colors.reverse().map(color => `</${color}>`).join('');

    return open + message + close;
  }

  /**
   * Send a message from a player
   * @param {GameState} state
   * @param {Player}    sender
   * @param {string}    message
   */
  send(state, sender, message) {
    // if they don't include a message, explain how to use the channel.
    if (!message.length) {
      return this.describeSelf(sender);
    }

    // check if character has a sufficient role for the channel
    if (this.audience instanceof RoleAudience && (sender.role < this.audience.minRole)) {
      // hide the channel's command if they lack the minimum role for the channel
      return Broadcast.sayAt(sender, "Huh?");
    }

    this.audience.configure({ state, sender, message });
    const targets = this.audience.getBroadcastTargets();

    // check if there are any players in the party
    if (this.audience instanceof PartyAudience && !targets.length) {
      if (!sender.party) {
        return Broadcast.sayAt(sender, "You aren't in a party.");
      } else {
        return Broadcast.sayAt(sender, "Your party is empty.");
      }
    }

    // allow audience to change message (e.g. strip target name)
    // currently does nothing
    message = this.audience.alterMessage(message);

    // private channels also send the target player to the formatter
    if (this.audience instanceof PrivateAudience) {
      if (!targets.length) {
        return Broadcast.sayAt(sender, "That person is not connected or does not exist.");
      }
      // stop the player if they try to talk on a private audience on themselves
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

  /**
   * Describe the channel and its usage to the sender
   * @param {Player}    sender
   */
  describeSelf(sender) {
    Broadcast.sayAt(sender, `\r\nChannel: ${this.name}`);
    Broadcast.sayAt(sender, 'Syntax: ' + this.getUsage());
    if (this.description) {
      Broadcast.sayAt(sender, this.description);
    }
  }

  /**
   * Provide the syntax for the channel
   * @return {string}
   */
  getUsage() {
    if (this.audience instanceof PrivateAudience) {
      return `${this.name} <target> [message]`;
    }

    return `${this.name} [message]`;
  }

  /**
   * Render the sender's message on the channel for the sender
   * @param {Player} sender
   * @param {Player} target ignored
   * @param {string} message
   * @param {Function} colorify
   * @return {string}
   */
  formatToSender(sender, target, message, colorify) {
    return colorify(`[${this.name}] ${sender.name}: ${message}`);
  }

  /**
   * Render the sender's message on the channel for the recipient
   * @param {Player} sender
   * @param {Player} target
   * @param {string} message
   * @param {Function} colorify
   * @return {string}
   */
  formatToRecipient(sender, target, message, colorify) {
    return this.formatToSender(sender, target, message, colorify);
  }
}

module.exports = Channel;
