// Load required packages
var User = require('../models/user');
var errorHandler = require('../errorHandler');
var guids = require('node-uuid');
var https = require('https');
var util = require('util');
var async = require('async');

exports.registerWithFb = function (req, res, next) {
    
    if (!("fbId" in req.body) || !("fbAccessToken" in req.body)) {
        return next(errorHandler.setUpErrorResponse(req, 400, "Missing data in request body", null));
    }

    var user = new User({
        pmaUserId: guids.v4()
    });
    
    user.socialNetworkLinks = {
        hasLinkedFb : true,
        fbId : req.body.fbId,
    };
    
    var graphUrl = util.format("https://graph.facebook.com/me?fields=id&access_token=%s", req.body.fbAccessToken);
    
    var graphResponseBody = '';
    var existingUser = {};
    
    async.series([
        //Start http request
        function (callback){
            https.get(graphUrl, function (res) {

                res.on('data', function (chunk) {
                    graphResponseBody += chunk;
                });
                
                res.on('end', function () {
                    return callback();//Go to next step in series
                });
            }).on('error', function (e) {
                errorHandler.setUpErrorResponse(req, 401, 'Error reaching third party authentication', e);
                return callback(e);
            });
        },
        //Handle output of http request
        function (callback){
            var fbResponse = JSON.parse(graphResponseBody)
            console.log("Got response: ", fbResponse.id);
            
            if (user.socialNetworkLinks.fbId != fbResponse.id) {
                return callback(errorHandler.setUpErrorResponse(req, 400, "Access token was not valid for supplied user id.", null));
            }

            //Look for existing user with same fbid first.
            //This is secure, because to get an access token you
            //already need control of the fb account
            
            User.findOne({ 'socialNetworkLinks.fbId': user.socialNetworkLinks.fbId }, function (err, u) {

                if (err) {
                    errorHandler.setUpErrorResponse(req, 500, 'Error looking up user.', err);
                    return callback(err);
                }
                    
                existingUser = u;
                return callback();
            });
        },
        //Handle result of finding user
        function (callback){

            if (existingUser) {
                req.statusMessage = 'Existing user returned!';
                user = existingUser;
            }
            else {
                req.statusMessage = 'Adding new user returned!';
            }
            
            req.result = {};
            
            //Whether adding new, or returning existing, generate new password and save it.
            
            user.password = guids.v4();
            
            var returnedUserView = {
                userId : user.pmaUserId,
                password : user.password,
            };
            
            user.save(function (err) {
                if (err) {
                    errorHandler.setUpErrorResponse(req, 500, 'Error saving user.', err);
                    return callback(err);
                }
                
                var newUser = { userId: user.pm }
                
                req.result.newUser = returnedUserView;
                return callback();
            });
        }
    
    ], function (err) {

        if (err) return next(err);

        return next();
    });
};

// Create endpoint /api/users for GET
exports.getUsers = function (req, res) {
    User.find(function (err, users) {
        if (err)
            res.send(err);
        
        res.json(users);
    });
};

exports.deleteAll = function (req, res, next) {
    User.remove({ 'socialNetworkLinks.hasLinkedFb' : true }, function (err) {
        if (err)
            return next(err);
        req.result = "ok";
        return next();
    });
};
