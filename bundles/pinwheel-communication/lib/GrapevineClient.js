'use strict';

const WebSocket = require('ws');
const EventEmitter = require('events');
const chalk = require('chalk');

const Logger = require('../../../src/Logger');

class GrapevineClient {
  constructor(state, version) {
    this.state = state;
    this.pinwheelVersion = version;
    this.channels = {};

    // assign channels
    state.ChannelManager.forEach((channel, key, map) => {
      if (channel.remoteChannel) {
        this.channels[channel.remoteChannel] = channel.name;
      }
    });

    // retrieve Grapevine configuration
    this.config = this.state.Config.get("grapevine");
    this.active = true;
  }

  /**
   * Attempt to reconnect to Grapevine
   */
  reconnect() {
    if (this.active === false) {
      return;
    }

    this.reconnectTimer = setTimeout(() => {
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
      }

      Logger.verbose(chalk.white.bold('Reconnecting to Grapevine...'));

      this.connect();
    }, 5 * 1000);
  }

  /**
   * Send a payload to the Grapevine server
   * @param {Object} event  Payload for Grapevine
   */
  send(event) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(event));
    }
  }

  /**
   * Connect to Grapevine and set up events
   */
  connect() {
    this.grapevineEmitter = new EventEmitter();
    this.state.GrapevineEmitter = this.grapevineEmitter;

    // create a new websocket server using the port command line argument
    const grapevineUrl = 'wss://grapevine.haus/socket';
    this.ws = new WebSocket(grapevineUrl);

    // when a player signs in
    // (https://grapevine.haus/docs#players-sign-in)
    this.grapevineEmitter.on('players/sign-in', (player) => {
      let event = {
        "event": "players/sign-in",
        "payload": {
          "name": player.name
        }
      };

      this.send(event);
    });

    // when a player signs out
    // (https://grapevine.haus/docs#players-sign-out)
    this.grapevineEmitter.on('players/sign-out', (player) => {
      let event = {
        "event": "players/sign-out",
        "payload": {
          "name": player.name
        }
      };

      this.send(event);
    });

    // when a player sends a message on a Grapevine channel
    // (https://grapevine.haus/docs#channels-send)
    this.grapevineEmitter.on("channels/send", (channel, sender, message) => {
      let event = {
        "event": "channels/send",
        "payload": {
          "channel": channel,
          "name": sender,
          "message": message
        }
      };

      this.send(event);
    });

    // when an error occurs while connecting to Grapevine
    this.ws.on("error", (err) => {
      Logger.error(chalk.red.bold('Grapevine ' + err));
    });

    // when the connection with Grapevine is initiated
    this.ws.on('open', () => {
      Logger.verbose(chalk.green.bold("Successfully connected to Grapevine!"));

      let auth = {
        "event": "authenticate",
        "payload": {
          "client_id": this.config.clientId,
          "client_secret": this.config.clientSecret,
          "supports": ["channels", "players"],
          "channels": Object.keys(this.channels),
          "user_agent": `Pinwheel ${this.pinwheelVersion}`
        }
      };

      this.ws.send(JSON.stringify(auth));
    });

    // when a payload arrives from Grapevine
    this.ws.on('message', data => {
      let event = JSON.parse(data);

      switch (event["event"]) {
        // process authentication response
        // (https://grapevine.haus/docs#authenticate)
        case "authenticate":
          Logger.verbose(chalk.green.bold(`Authenticating server... ${event["status"]}!`));

          this.active = event["status"] == "success";

          break;

        // process reponse to heartbeat
        // (https://grapevine.haus/docs#heartbeat)
        case "heartbeat":
          let players = [];
          this.state.PlayerManager.players.forEach(player => {
            players.push(player.name);
          })

          let message = {
            "event": "heartbeat",
            "payload": {
              "players": players
            }
          };
          this.ws.send(JSON.stringify(message));

          break;

        // process reponse to channel broadcast
        // (https://grapevine.haus/docs#channels-broadcast)
        case "channels/broadcast":
          let payload = event["payload"];

          Logger.verbose(`${chalk.white.bold('<G>')}${payload["name"]}@${payload["game"]}: "${payload["message"]}"`);

          let player = {
            isGrapevine: true,
            name: `${payload["name"]}@${payload["game"]}`,
            getBroadcastTargets: () => {
              return [];
            }
          };

          let channel = this.channels[payload["channel"]];

          this.state.ChannelManager.get(channel).send(this.state, player, payload["message"]);

          break;
      }
    });

    // if the connect closes, attempt reconnection
    this.ws.on("close", () => {
      this.reconnect();
    });
  }
}

module.exports = GrapevineClient;
