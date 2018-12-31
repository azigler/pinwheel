'use strict';

/**
 * Administrator species
 * 
 * Characters of this species have the 'ADMIN' PlayerRole.
 */
module.exports = srcPath => {
  const PlayerRole = require(srcPath + 'PlayerRole');

  return {
    name: 'administrator',
    description: 'You are a game administrator.',

    attributeTable: {
          health: 100,
          energy: 100,
            mana: 100,
           favor: 100,

           brawn: 10,
       endurance: 10,
        reflexes: 10,
      perception: 10,
       intellect: 10,
        charisma: 10,
            luck: 10,

           armor: 5,
        critical: 5
    },

    descriptionGrammar: {
      'body type': [
        'thin',
        'muscular',
        'fat',
        'curvy',
        'wiry',
        'average'
      ],
      'skin color': [
        'pale',
        'reddish',
        'brown',
        'dark',
        'olive',
        'yellow'
      ],
      'eye color': [
        'blue',
        'green',
        'brown',
        'gray',
        'hazel'
      ],
      'eye type': [
        'almond',
        'round',
        'narrow',
        'slanted'
      ],
      'hair color': [
        'brown',
        'black',
        'blonde',
        'red',
        'gray'
      ],
      'hair style': [
        'cropped',
        'short',
        'shaggy',
        'long',
        'quiffed',
        'ponytailed',
        'braided',
        'pigtailed',
        'bald',
        'dreadlocked',
        'spiked',
        'mulleted',
        'bun-wrapped'
      ]
    },

    renderDescription: (descriptionTable) => {
      let gender = 'male';
      if (descriptionTable.gender === 'f') {
        gender = 'female';
      }

      if (descriptionTable['hair style'] === 'bald') {
        return `This ${descriptionTable['body type']} ${gender} human has ${descriptionTable['skin color']} skin, ${descriptionTable['eye color']} ${descriptionTable['eye type']} eyes, and no hair.`;
      } else {
        return `This ${descriptionTable['body type']} ${gender} human has ${descriptionTable['skin color']} skin, ${descriptionTable['eye color']} ${descriptionTable['eye type']} eyes, and ${descriptionTable['hair style']} ${descriptionTable['hair color']} hair.`;
      }
    },

    setup: character => {
      character.prompt = '[ <b><red>%health.current%</b></red>/<b><red>%health.max%</red></b> <b>health</b> <b><yellow>%energy.current%</yellow></b>/<b><yellow>%energy.max%</yellow></b> <b>energy</b> <b><blue>%mana.current%</blue></b>/<b><blue>%mana.max%</b></blue> <b>mana</b> <b><green>%favor.current%</green></b>/<b><green>%favor.max%</green></b> <b>favor</b> ]';

      if (character.role >= PlayerRole.ADMIN) {
        return;
      }
      character.role = PlayerRole.ADMIN;
    }
  };
};
