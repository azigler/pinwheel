'use strict';

const fs = require('fs');
const srcPath = __dirname + '/../';

class HydrationUtil {
  /**
   * Hydrate a script on an entity
   * @param {entity} entity Entity on which to hydrate the script
   * @param {string} scriptPath Path to the script file
   */
  static hydrateScript(entity, scriptPath) {
    if (!fs.existsSync(scriptPath)) {
      return;
    }

    const scriptListeners = require(scriptPath)(srcPath).listeners;
    for (const [eventName, listener] of Object.entries(scriptListeners)) {
      entity.on(eventName, listener(this.state));
    }
  }
}

module.exports = HydrationUtil;
