'use strict';

module.exports = (srcPath) => {
  const Broadcast = require(srcPath + 'Broadcast');

  return  {
    listeners: {
      playerEnter: state => function (player) {
        Broadcast.sayAt(player, 'AREA: this is a script');
        console.log(`source: ${this.title}`);
      }
    }
  };
};