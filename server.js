// Load required packages
var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var passport = require('passport');

//Setup
var routing = require('./routing.js');

//Middleware
var formatResponse = require('./middleware/formatResponse.js');
var errorHandler = require('./middleware/globalErrorHandler.js');

// Connect to the beerlocker MongoDB
mongoose.connect('mongodb://localhost:27017/pma_appdata');

// Create our Express application
var app = express();

// Use the body-parser package in our application
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

// Use the passport package in our application
app.use(passport.initialize());

//app.use(function (req, res, next) {
//    console.log('%s %s', req.method, req.url);
//    next();
//});


// Create our Express router
var router = express.Router();
routing.configureRoutes(app, router);

//Add global post middleware
app.use(errorHandler.globalErrorHandler);

app.use(formatResponse.formatResponse);

//Run app
var port = 3000;

console.log("Listening on port %s", port);
// Start the server
app.listen(port);