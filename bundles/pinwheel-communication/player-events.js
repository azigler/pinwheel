'use strict';

module.exports = srcPath => {
  return {
    listeners: {
      /**
       * Report the player to the Grapevine network upon login
       */
      login: state => function() {
        if (state.GrapevineEmitter) {
          state.GrapevineEmitter.emit('players/sign-in', this);
        }
      },

      /**
       * Report the player to the Grapevine network upon disconnecting
       */
      quit: state => function() {
        if (state.GrapevineEmitter) {
          state.GrapevineEmitter.emit('players/sign-out', this);
        }
      },
    }
  };
};
