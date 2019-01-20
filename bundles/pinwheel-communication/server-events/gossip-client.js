'use strict';

const GossipClient = require("../lib/GossipClient");
const Config = require('../../../src/Config');

module.exports = srcPath => {
  return {
    listeners: {
      /**
       * Initialize a connection to the Gossip network
       * (https://gossip.haus/)
       */
      startup: state => (commander) => {
        if ((Config.get("gossip") && commander.gossip) !== false) {
          let gossipClient = new GossipClient(state, commander.version());
          state.GossipClient = gossipClient;
          gossipClient.connect();
        }
      },

      shutdown: state => function () {
        // no need to do anything special in shutdown
      },
    }
  };
};
