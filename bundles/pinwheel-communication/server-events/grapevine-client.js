'use strict';

const GrapevineClient = require("../lib/GrapevineClient");
const Config = require('../../../src/Config');

module.exports = srcPath => {
  return {
    listeners: {
      /**
       * Initialize a connection to the Grapevine network
       * (https://grapevine.haus/)
       */
      startup: state => (commander) => {
        if ((Config.get("grapevine") && commander.grapevine) !== false) {
          let grapevineClient = new GrapevineClient(state, commander.version());
          state.GrapevineClient = grapevineClient;
          grapevineClient.connect();
        }
      },

      shutdown: state => function () {
        // no need to do anything special in shutdown
      },
    }
  };
};
