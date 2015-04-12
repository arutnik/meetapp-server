var UserProfile = require('../models/userProfile');
var errorHandler = require('../errorHandler');

var addUserProfile = function (req, res, next) {
    
    UserProfile.findOne({ _user: req.user._id }, function (err, userProfile) {

        if (err) {
            errorHandler.setUpErrorResponse(req, 500, 'Error finding user profile', err);
            return next(err);
        }

        if (!userProfile) {
            return next(errorHandler.setUpErrorResponse(req, 401, 'Unable to find user profile', err));
        }

        req.userProfile = userProfile;

        return next();
    });
};

var addUserProfileWithMeets = function (req, res, next) {
    
    UserProfile.findOne({ _user: req.user._id })
    .populate('meets')
    .exec(function (err, userProfile) {
        
        if (err) {
            errorHandler.setUpErrorResponse(req, 500, 'Error finding user profile', err);
            return next(err);
        }
        
        if (!userProfile) {
            return next(errorHandler.setUpErrorResponse(req, 401, 'Unable to find user profile', err));
        }
        
        req.userProfile = userProfile;
        
        return next();
    })
    ;
};

module.exports.withoutMeets = addUserProfile;
module.exports.withMeets = addUserProfileWithMeets;