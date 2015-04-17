var Meet = require('../models/meet.js');
var MeetHub = require('../models/meetHub.js');
var UserProfile = require('../models/userProfile.js');
var errorHandler = require('../errorHandler');
var async = require('async');
var _ = require('underscore');
var moment = require('moment');

// Create endpoint /api/meetsfeed/ for GET
exports.getNextMeetFeedResults = function (req, res, next) {
    
    Meet.getNextMeetFeedResults(req.userProfile, req.rejectedMeets, 20, function (err, model) {

        if (err)
            return next(err);
        
        _.forEach(model, function (e, i, list) {
            e.stripUserDataForLightView();
        });

        req.result = { data: model };

        return next();
    });
}
