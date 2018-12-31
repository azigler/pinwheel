'use strict';

module.exports = srcPath => {
  return {
    listeners: {
      /**
       * Report the player to the Gossip network upon login
       */
      login: state => function() {
        state.GossipEmitter.emit('players/sign-in', this);
      },

      /**
       * Report the player to the Gossip network upon disconnecting
       */
      quit: state => function() {
        state.GossipEmitter.emit('players/sign-out', this);
      },
    }
  };
};
