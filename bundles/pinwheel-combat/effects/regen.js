'use strict';

module.exports = srcPath => {
  const Broadcast = require(srcPath + 'Broadcast');
  const Damage = require(srcPath + 'Damage');
  const Heal = require(srcPath + 'Heal');
  const Flag = require(srcPath + 'EffectFlag');

  return {
    config: {
      name: 'Regenerate',
      description: "You are regenerating over time.",
      type: 'regen',
      tickInterval: 3
    },
    flags: [Flag.BUFF],
    state: {
      magnitude: 10,
    },
    listeners: {
      updateTick: function () {
        // pools that regenerate over time
        const regens = [
          { pool: 'health', modifier: this.target.isInCombat() ? 0 : 1 },
          // energy and mana recovers 50% faster than health
          { pool: 'energy', modifier: this.target.isInCombat() ? 0.25 : 1.5 },
          { pool: 'mana', modifier: this.target.isInCombat() ? 0.25 : 1.5 },
        ];

        for (const regen of regens) {
          if (!this.target.hasAttribute(regen.pool)) {
            continue;
          }

          const poolMax = this.target.getMaxAttribute(regen.pool);
          const heal = new Heal({
            attribute: regen.pool,
            amount: Math.round((poolMax / 10) * regen.modifier),
            source: this,
            hidden: true,
          });
          // prevent attributes from regenerating beyond their natural maximum
          if (this.target.getAttribute(regen.pool) >= this.target.getMaxAttribute(regen.pool)) {
            this.target.setAttributeToMax(regen.pool);
          } else {
            heal.commit(this.target);
          }
        }

        // favor is treated specially in that it drains over time
        if (this.target.hasAttribute('favor')) {
          const maxFavor = this.target.getMaxAttribute('favor');

          // prevent favor from draining below zero
          if (this.target.getAttribute('favor') <= 0) {
            this.target.attributes.get('favor').setDelta(-maxFavor);
          }

          // if favor is already zero or the character is fighting
          if (this.target.getAttribute('favor') < 1 || this.target.isInCombat()) {
            return;
          }

          const drain = new Damage({
            attribute: 'favor',
            amount: Math.ceil(maxFavor / 10),
            source: this,
            hidden: true
          });
          drain.commit(this.target);
        }
      },
    }
  };
};
