const createError = require('http-errors');
const schedule = require('node-schedule');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const SERVER_SETTINGS = require('./classes/settings/SERVER.json');
const app = express();

// Require all needed routes
const addPort = require('./routes/addport');
const removePort = require('./routes/removeport');

// Setup using modules
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors());

// Setup api route
app.use('/api/addport', addPort);
app.use('/api/removeport', removePort);

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.json({status: "error"});
});

// Launching server
const server = app.listen(SERVER_SETTINGS.SERVER_PORT, function () {

  const host = server.address().address;
  const port = server.address().port;

  console.log("App listening at http://%s:%s", host, port);
});


module.exports = app;