const express = require('express');
const mongoose = require('mongoose');

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'ReadMore API is running',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

module.exports = app;
