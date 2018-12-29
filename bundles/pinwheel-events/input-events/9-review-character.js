'use strict';

/**
 * Player character creation completion event
 */
module.exports = (srcPath) => {
  const Player = require(srcPath + 'Player');

  return {
    event: state => (socket, args) => {
      const species = state.SpeciesManager.getAspect(args.species);

      // create the player character
      let player = new Player({
        name: args.name,
        account: args.account,
        species: args.species,
        archetypes: [args.archetype],
        traits: args.traits,
        description: species.renderDescription(args.descriptionTable),
      });

      // TODO: review character, allow to go back to certain stages

      // add the character to the player's account
      args.account.addCharacter(args.name);
      args.account.save();

      // place the character in the game world
      const room = state.RoomManager.startingRoom;
      player.room = room;

      // set up the player character
      player.hydrate(state);

      // add default combat stats
      player.addAttribute('armor', 0);
      player.addAttribute('critical', 0);
      player.addAttribute('fatigue', 0);

      player.save();

      // reload from manager to make sure everything will work for future loads
      player = state.PlayerManager.loadPlayer(state, player.account, player.name);
      player.socket = socket;

      socket.emit('done', socket, { player });
    }
  };
};
