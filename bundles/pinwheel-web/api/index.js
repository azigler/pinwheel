'use strict';

const api = require('express').Router();

api.get('/', (req, res) => {
  res.status(200).json({ message: 'Connected!' });
});

module.exports = api;