'use strict';

const views = require('express').Router();

views.get('/', (req, res) => {
  // TODO: make into object
  const WHO_COUNT = `${views.state.PlayerManager.players.size}`;
  // render the HTML's variables
  // TODO: pass in object above (use destructuring)
  res.render('index.html', {locals: {WHO_COUNT}})
})

module.exports = views;