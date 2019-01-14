'use strict';

module.exports = srcPath => {
  const Broadcast = require(srcPath + 'Broadcast');
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
          entityReference: 'start:corpse',
          id: 'corpse',
          name: `corpse of ${this.name}`,
          roomDesc: `corpse of ${this.name}`,
          uuid: this.uuid,
          type: 'CONTAINER',
          maxItems: items.length,
          description: `This is the corpse of ${this.name}.`,
          keywords: this.keywords.concat(['corpse']),
          metadata: {
            noRetrieve: true,
          },
          behaviors: {
            decay: {
              // decay in 2 minutes
              duration: 120
            }
          },
        };
        const corpse = new Item(this.area, corpseData);
        corpse.hydrate(state, corpseData);

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
            Broadcast.sayAt(winner, "<b><black>You look over the remains...</black></b>");
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
