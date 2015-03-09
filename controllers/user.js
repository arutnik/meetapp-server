// Load required packages
var User = require('../models/user');
var guids = require('node-uuid');
var https = require('https');
var util = require('util');

// Create endpoint /api/users for POST
exports.registerWithFb = function (req, res, next) {
    
    //Check if existing user

    var user = new User({
        pmaUserId: guids.v4()
    });
    
    user.socialNetworkLinks = {
        hasLinkedFb : true,
        fbId : req.body.fbId,
    };
    
    var graphUrl = util.format("https://graph.facebook.com/me?fields=id&access_token=%s", req.body.fbAccessToken);
    
    
    https.get(graphUrl, function (res) {
        var body = '';
        
        res.on('data', function (chunk) {
            body += chunk;
        });
        
        res.on('end', function () {
            var fbResponse = JSON.parse(body)
            console.log("Got response: ", fbResponse.id);
           

            if (user.socialNetworkLinks.fbId != fbResponse.id) {
                var wrongIdError = new Error("That token goes with a different user id.");

                return next(wrongIdError);
            }
            
            //Look for existing user with same fbid first.
            //This is secure, because to get an access token you
            //already need control of the fb account
            
            User.findOne({ 'socialNetworkLinks.fbId': user.socialNetworkLinks.fbId }, function (err, existingUser) {
                if (err)
                    return next(err);
               

                if (existingUser) {
                    req.result = { message: 'Existing user returned!' };
                    user = existingUser;
                }
                else {
                    req.result = { message: 'Adding new user returned!' };
                }

                //Whether adding new, or returning existing, generate new password and save it.
                
                user.password = guids.v4();

                var returnedUserView = {
                    userId : user.pmaUserId,
                    password : user.password,
                };

                user.save(function (err) {
                    if (err) {
                        return next(err);
                    }
                    
                    var newUser = { userId: user.pm }
                    
                    req.result.newUser = returnedUserView;
                    return next();
                });
            });
           

        });
    }).on('error', function (e) {
        console.log('bugaboo');
        return next(e);
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
