'use strict';

// import 3rd party WebSocket library
const WebSocket = require('ws');

// import adapter
const WebSocketStream = require('../lib/WebSocketStream');

const chalk = require('chalk');

module.exports = srcPath => {
  const Logger = require(srcPath + 'Logger');
  const Config = require(srcPath + 'Config');

  return {
    listeners: {
      startup: state => function (commander) {
        // create a new WebSocket server using the port command line argument
        const wss = new WebSocket.Server({ port: commander.websocketport });

        // This creates a super basic "echo" WebSocket server
        wss.on('connection', function connection(ws) {

          // create our adapter
          const stream = new WebSocketStream();
          stream.ipAddress = ws._socket.remoteAddress;
          // and attach the raw WebSocket
          stream.attach(ws);

          // Register all of the input events (login, etc.)
          state.InputEventManager.attach(stream);

          stream.write("Establishing WebSocket connection...\n");
          Logger.log("New WebSocket client connected...");

          // TIP: bundles/pinwheel-input/input-events/intro.js
          stream.emit(Config.get('introEvent', 'intro'), stream);
        });
        Logger.log(`WebSocket server started on port: ${chalk.green.bold(wss.options.port)}...`);
      },

      shutdown: state => function () {
        // no need to do anything special in shutdown
      },
    }
  };
};
