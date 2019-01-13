'use strict';

const sprintf = require('sprintf-js').sprintf;

/**
 * Render a table of a character's skills with mastery levels
 * 
 * @param {string}    args       Arguments provided for the command
 * @param {Character} character  Character checking their skill list
 */
module.exports = srcPath => {
  const B = require(srcPath + 'Broadcast');

  return {
    aliases: ['abilities', 'spells', 'disciplines'],
    command: state => (args, character) => {
      const say = message => B.sayAt(character, message);

      if (character.skills.size === 0) {
        return B.sayAt(character, 'You have no skills...');
      }

      // render skill table header
      say("<b>" + B.center(78, 'Skills', 'green'));
      say("<b>" + B.line(78, '~', 'green'));

      let i = 0;
      let line = '';
      
      // for each skill the character has
      for (const sk of character.skills) {
        // pull its skill definition
        let skill = state.AbilityManager.get(sk[0])
          || state.SpellManager.get(sk[0])
          || state.DisciplineManager.get(sk[0]);

        // if the skill isn't hidden, add it to the skill table
        if (!skill.hidden) {
          let name = sprintf("%-15s", skill.name);
          let mastery = '';
          mastery = sprintf("%44s", `<magenta><bold>${character.getAttribute(skill.id)}</bold>%</magenta>   `);
          name = `<green>${name}</green>`;
          line += name + mastery;

          // print 3 skills per line
          if (++i % 3 === 0) {
            B.at(character, line);
            say();
            line = '';
          } else {
            if ((i > character.skills.size - 1) && (i < character.skills.size + 1)) {
              B.at(character, line);
            }
          }
        }
      }
      if (!(i % 3 === 0)) {
        say();
      }
      // render the skill table bottom border
      say('<b><green>' + B.line(78) + '</green></b>');
    }
  };
};
