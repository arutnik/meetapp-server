// Load required packages
var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');

var testController = require('./controllers/test.js');

// Connect to the beerlocker MongoDB
mongoose.connect('mongodb://localhost:27017/pma_appdata');

// Create our Express application
var app = express();

// Use the body-parser package in our application
app.use(bodyParser.urlencoded({
    extended: true
}));

// Use the passport package in our application
//app.use(passport.initialize());

app.use(function (req, res, next) {
    console.log('%s %s', req.method, req.url);
    next();
});

// Create our Express router
var router = express.Router();

// Create endpoint handlers for /beers
router.route('/test')
  .get(testController.getTest);


// Register all our routes with /api
app.use('/api', router);

app.use(function (err, req, res, next) {
    
    console.error(err.stack);
    
    res.status(500).send(err);

});

//callback for json wrapping - just an example
app.use(function (req, res, next) {
    
    if (req.result) {
        console.log('%s', req.result);
        res.json(req.result);
    }
    
    
    return next();
});


var port = 3000;

console.log("Listening on port %s", port);
// Start the server
app.listen(port);