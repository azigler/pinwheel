'use strict';

const chalk = require('chalk');

module.exports = (srcPath) => {
  const Logger = require(srcPath + 'Logger');
  const Config = require(srcPath + 'Config');

  return {
    listeners: {
      startup: state => function (commander) {
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

        // start web server
        const webConfig = Config.get('web');
        const port = webConfig.port;
        web.listen(port, () => Logger.log(`Web server started on port: ${chalk.green.bold(port)}...`))
      },

      shutdown: state => function () {
        // no need to do anything special in shutdown
      },
    }
  };
}
