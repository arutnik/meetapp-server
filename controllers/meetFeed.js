var Meet = require('../models/meet.js');
var UserRejectedMeets = require('../models/userRejectedMeets.js');
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

        req.result = { data: model, rejectedMeetCount : req.rejectedMeets.rejectedMeets.length };

        return next();
    });
}

exports.rejectMeets = function (req, res, next) {

    var meets = req.body.meets;

    meets = _.map(meets, function (m) { return { meetId : m , checkForCleanUpOn : new Date(Date.now()) }; }); //TODO, add date

    UserRejectedMeets.rejectMeets(req.userProfile._id, meets, function (err, m) {
        
        if (err)
            return next(err);

        req.result = { ok : true };
        return next();
    });
}

exports.removeAllRejects = function (req, res, next) {
    
    UserRejectedMeets.removeAll(req.userProfile._id, function (err, m) {
        
        if (err)
            return next(err);
        
        req.result = { ok : true };
        return next();
    });
}
