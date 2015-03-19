var passport = require('passport');
var BasicStrategy = require('passport-http').BasicStrategy;
var User = require('../models/user');
var UserProfile = require('../models/userProfile');
var errorHandler = require('../errorHandler');

passport.use('basic', new BasicStrategy(
    function (username, password, callback) {
        User.findOne({ pmaUserId: username }, function (err, user) {
            if (err) {
                errorHandler.setUpErrorResponse(req, 401, 'Error finding user.', err);
                return callback(err);
            }
            
            // No user found with that username
            if (!user) { return callback(null, false); }
            
            // Make sure the password is correct
            user.verifyPassword(password, function (err, isMatch) {
                if (err) { return callback(err); }
                
                // Password did not match
                if (!isMatch) { return callback(null, false); }
                
                // Success
                return callback(null, user);
            });
        });
    }
));

exports.isAuthenticated = passport.authenticate('basic', { session : false });