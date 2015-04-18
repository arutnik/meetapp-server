var UserRejectedMeets = require('../models/userRejectedMeets.js');
var errorHandler = require('../errorHandler');

var addUserRejectedMeets = function (req, res, next) {
    
    UserRejectedMeets.getOrCreateForUser(req.userProfile._id, function (err, rejectedMeets) {

        if (err) {
            errorHandler.setUpErrorResponse(req, 500, 'Error finding user rejected meets', err);
            return next(err);
        }

        if (!rejectedMeets) {
            return next(errorHandler.setUpErrorResponse(req, 401, 'Unable to find user rejected meets.', err));
        }

        req.rejectedMeets = rejectedMeets;

        return next();
    });
};


module.exports = addUserRejectedMeets;