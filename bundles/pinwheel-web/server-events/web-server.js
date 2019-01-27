'use strict';

const chalk = require('chalk');

module.exports = (srcPath) => {
  const Logger = require(srcPath + 'Logger');
  const Config = require(srcPath + 'Config');

  return {
    listeners: {
      startup: state => function (commander) {
        const https = require('https');
        const fs = require('fs');
        const express = require('express')
        const es6Renderer = require('express-es6-template-engine')
        const web = express()

        // define routes for public pages and API
        const views = require('../views');
        const api = require('../api');
        
        // pass state to both
        api.state,
        views.state = state
        
        // set rendering engine for public pages
        web.engine('html', es6Renderer);
        web.set('view engine', 'html');

        // set directories for public pages
        web.set('views', 'public/');
        web.use('/assets', express.static('public/assets'));

        // connect routes to server
        web.use('/', views);
        web.use('/api', api);

        const webConfig = Config.get('web');
        const certExists = fs.existsSync(webConfig.https.key) && fs.readFileSync(webConfig.https.fullchain);

        if ((webConfig.https && certExists) !== false) {
          // start HTTPS server
          https.createServer({
            key: fs.readFileSync(webConfig.https.key),
            cert: fs.readFileSync(webConfig.https.fullchain)
          }, web).listen(webConfig.https.port, () => {
            Logger.log(`HTTPS server started on port: ${chalk.green.bold(webConfig.https.port)}...`)
          })
        }

        // start HTTP server
        const port = webConfig.port;
        web.listen(port, () => Logger.log(`HTTP server started on port: ${chalk.green.bold(port)}...`))
      },

      shutdown: state => function () {
        // no need to do anything special in shutdown
      },
    }
  };
}
