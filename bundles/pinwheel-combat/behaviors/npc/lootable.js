'use strict';

module.exports = srcPath => {
  const Player = require(srcPath + 'Player');
  const Loot = require(srcPath + 'Loot');
  const Item = require(srcPath + 'Item');
  const Logger = require(srcPath + 'Logger');

  return {
    listeners: {
      killed: state => function (config, killer) {
        // determine loot
        const loot = new Loot(state, config);
        const currencies = loot.currencies();
        const items = loot.items().map(
          item => state.ItemFactory.create(state.AreaManager.getAreaByReference(item), item)
        );

        // produce a lootable corpse
        const corpseData = {
          entityReference: 'spawn:99',
          id: 99,
          name: `corpse of ${this.name}`,
          roomDesc: `the corpse of ${this.name}`,
          uuid: this.uuid,
          type: 'CONTAINER',
          maxItems: items.length,
          description: `This is the rotting corpse of ${this.name}.`,
          keywords: this.keywords.concat(['corpse']),
          metadata: {
            noPickup: true,
          },
          behaviors: {
            decay: {
              duration: 20
            }
          },
        };
        const corpse = new Item(this.area, corpseData);
        corpse.hydrate(state, corpseData);
        Logger.log(`Generated corpse: ${corpse.uuid}`);

        // add loot to corpse
        items.forEach(item => {
          item.hydrate(state);
          corpse.addItem(item);
        });

        // add corpse to room
        this.room.addItem(corpse);
        state.ItemManager.add(corpse);
        
        // reward currencies to winner(s)
        if (killer) {
          // determine who won the fight (either solo or with party members in the same room)
          const winners = (killer.party ? [...killer.party] : [killer]).filter(winner => {
            return winner.room === killer.room;
          });
          
          for (const winner of winners) {
            // force the winner(s) to look at the new corpse (to see the items contained)
            state.CommandManager.get('look').execute(corpse.uuid, winner);
          }

          if (currencies) {
            currencies.forEach(currency => {
              let remaining = currency.amount;
              for (const winner of winners) {
                // Split currency evenly among winners. The leader of the party
                // will get any remainder if the currency isn't evenly divisible
                const amount = Math.floor(remaining / winners.length) + (remaining % winners.length);
                remaining -= amount;
                
                winner.emit('currency', currency.name, amount);
              }
            });
          }
        }
      }
    }
  };
};
