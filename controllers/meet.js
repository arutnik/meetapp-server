﻿var Meet = require('../models/meet.js');
var errorHandler = require('../errorHandler');
var async = require('async');

// Create endpoint /api/meets/:meet_id/join for POST
exports.joinMeet = function (req, res, next) {
    
    Meet.joinMeetIfRoom(req.params.meet_id, req.userProfile._id, function (err, didJoin) {
    
        if (err) {
            errorHandler.setUpErrorResponse(req, 400, "Error joining meet.", err);
            return next(err);
        }
        
        if (!didJoin) {
            return next(errorHandler.setUpErrorResponse(req, 410, "Was not allowed to join the meet", null));
        }

        req.result = { joined: true };

        return next();
    });

}

// Create endpoint /api/meets/:meet_id/leave for POST
exports.leaveMeet = function (req, res, next) {
    
    //if (!("bannedUser" in req.body) || !("fbAccessToken" in req.body)) {
    //    return next(errorHandler.setUpErrorResponse(req, 400, "Missing data in request body", null));
    //}

    Meet.leaveMeet(req.params.meet_id, req.userProfile._id, function (err, didLeave) {

        if (err) {
            errorHandler.setUpErrorResponse(req, 400, "Error leaving meet.", err);
            return next(err);
        }

        req.result = { left: didLeave };

        return next();
    });
}

// Create endpoint /api/meets/:meet_id/ban for POST
exports.banAttendee = function (req, res, next) {
    
    if (!("bannedUserId" in req.body)) {
        return next(errorHandler.setUpErrorResponse(req, 400, "Missing data in request body.", null));
    }
    
    var existingMeet = null;
    var breakAsync = { doBreak: true };
    var result = {};
    
    async.series([
        //Get basic meet data
        function (callback){

            Meet.findOne({ _id : req.params.meet_id }, function (err, model) {
                existingMeet = model;

                if (err) {
                    return callback(err);
                }

                return callback();
            });
        },
        //Check if meet exists, and calling user is the host
        function (callback){

            if (!existingMeet) {
                return callback(errorHandler.setUpErrorResponse(req, 400, "Invalid Meet Id.", null));
            }

            if (!req.userProfile._id.equals(existingMeet._meetHost)) {
                return callback(errorHandler.setUpErrorResponse(req, 403, "Not authorized to modify Meet.", null));
            }

            Meet.banAttendee(existingMeet._id, req.body.bannedUserId, function (err, didBan) {

                if (err) {
                    errorHandler.setUpErrorResponse(req, 500, "Failed to ban attendee", err);
                    return callback(err);
                }

                result.didBan = didBan;

                return callback();
            });
        }
    ], function (err) { 
    
        if (err && err != breakAsync) {
            return next(err);
        }

        req.result = result;

        return next();
    });
    
}

// Create endpoint /api/meets/:meet_id/unban for POST
exports.unBanAttendee = function (req, res, next) {
    
    if (!("bannedUserId" in req.body)) {
        return next(errorHandler.setUpErrorResponse(req, 400, "Missing data in request body.", null));
    }
    
    var existingMeet = null;
    var breakAsync = { doBreak: true };
    var result = {};
    
    async.series([
        //Get basic meet data
        function (callback) {
            
            Meet.findOne({ _id : req.params.meet_id }, function (err, model) {
                existingMeet = model;
                
                if (err) {
                    return callback(err);
                }
                
                return callback();
            });
        },
        //Check if meet exists, and calling user is the host
        function (callback) {
            
            if (!existingMeet) {
                return callback(errorHandler.setUpErrorResponse(req, 400, "Invalid Meet Id.", null));
            }
            
            if (!req.userProfile._id.equals(existingMeet._meetHost)) {
                return callback(errorHandler.setUpErrorResponse(req, 403, "Not authorized to modify Meet.", null));
            }
            
            Meet.unBanAttendee(existingMeet._id, req.body.bannedUserId, function (err, didUnBan) {
                
                if (err) {
                    errorHandler.setUpErrorResponse(req, 500, "Failed to unban attendee", err);
                    return callback(err);
                }
                
                result.didBan = didUnBan;
                
                return callback();
            });
        }
    ], function (err) {
        
        if (err && err != breakAsync) {
            return next(err);
        }
        
        req.result = result;
        
        return next();
    });
    
}

exports.createMeet = function (req, res, next) {

    var newMeet = new Meet({
        title: req.body.title,
        _meetHost: req.userProfile._id,
        status: 'active',
        startTimeUtc: Date.now(),
        lengthMinutes: 1,
        pictures: [],
        location: { lat: 1.0, long: 1.0 },
        interests: [],
        attendees: [],
        bannedAttendees: [],
        attendeeSpace : 4,
        attendeeStatus : {},
        maxCapacity : 4,
        attendeeCriteria : {
            genders: [],
            minAge : 50,
            maxAge : 30,
        },
        userCreationId : req.body.userCreationId
    });
    
    var createReturnResultFromMeet = function (someMeet){
        return {
            id: someMeet._id
        };
    }
    
    var existingMeet = null;
    
    var breakAsync = { breakOut: true };
    var result = {};
    
    async.series([
        //find existing user
        function (callback){
            Meet.findOne({ userCreationId: req.body.userCreationId }, function (e, m) {
                if (e) {
                    errorHandler.setUpErrorResponse(req, 500, 'Error finding existing meet', e);
                    return callback(e);
                }
                
                existingMeet = m;
                return callback();
            });
        },
        //React to existing
        function (callback){
            if (existingMeet) {
                //if (existingMeet._meetHost != req.auth.UserProfile._id) {
                //    return callback(errorHandler.setUpErrorResponse(req, 401, 'This meet has been created already by another user.', null));
                //}

                result = createReturnResultFromMeet(existingMeet);

                return callback(breakAsync);
            }

            return callback();
        },
        //Adding a new meet
        function (callback){

            newMeet.save(function (e, savedModel) {
                if (e) {
                    errorHandler.setUpErrorResponse(req, 500, 'Error saving new meet', e);
                    return callback(e);
                }

                result = createReturnResultFromMeet(savedModel);

                return callback(breakAsync);
            });
        }
    ], function (err) {
        if (err && err != breakAsync) {
            return next(err);
        }
        
        req.result = result;

        return next();
    });

    
};