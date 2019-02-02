'use strict';

const views = require('express').Router();
const Config = require('../../../src/Config');
const fs = require('fs');

const webConfig = Config.get('web');
const certExists = fs.existsSync(webConfig.https.key) && fs.readFileSync(webConfig.https.fullchain);

// determine if we're including 'https' in the final URL
let httpString = '';
(webConfig.https === false || !certExists) ? httpString = 'http://' : httpString = 'https://';

if ((webConfig.https && certExists) !== false) {
  // redirect HTTP to HTTPS
  views.use(function (req, res, next) {
    if (!/https/.test(req.protocol)) {
      return res.redirect("https://" + req.headers.host + req.url)
    } else {
      return next()
    }
  })
}

views.get('/', (req, res) => {
  // pass anything needed from state or config to the page for rendering
  const locals = {};

  let whoList = '';
  let multiArch = '';

  views.state.PlayerManager.players.forEach((whoPlayer) => {
    multiArch = '';
    for (let arch of whoPlayer.archetypes) {
      multiArch += `${arch}-`;
    }
    multiArch = multiArch.slice(0, -1);
    whoList += `${whoPlayer.name} the ${whoPlayer.species} ${multiArch}\n`;
  });

  let gameMeta = Config.get('meta');
  if (gameMeta === false) {
    gameMeta = {
      author: false,
      gameName: 'Pinwheel',
      twitterHandle: false
    }
  }
  Object.assign(locals, gameMeta);

  if (webConfig.header === false) {
    webConfig.header = {
      description: 'Powered by Pinwheel, a JavaScript MUD engine.',
      faviconUrl: '/assets/pinwheel.ico',
      googleId: false,
      image: '/assets/pinwheel-header.png'
    };
  }
  Object.assign(locals, webConfig);

  Object.assign(locals, {
    finalUrl: httpString + req.headers.host + req.url,
    whoCount: `${views.state.PlayerManager.players.size}`,
    whoList,
    serverUrl: req.headers.host,
    telnetPort: Config.get('telnetPort')
  })

  // render the HTML's variables
  res.render('index.html', {locals})
})

module.exports = views;