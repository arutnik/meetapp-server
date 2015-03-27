var Meet = require('../models/meet.js');
var MeetHub = require('../models/meetHub.js');
var UserProfile = require('../models/userProfile.js');
var errorHandler = require('../errorHandler');
var async = require('async');
var _ = require('underscore');
var moment = require('moment');

// Create endpoint /api/meets/:meet_id for GET
exports.getMeet = function (req, res, next) {
    Meet.findOne({ _id: req.params.meet_id })
    .populate('_meetHost')
    .populate('attendees')
    .populate('bannedAttendees')
    .exec(function (err, model) {
        
        if (err) {
            errorHandler.setUpErrorResponse(req, 400, "Error joining meet.", err);
            return next(err);
        }
        
        if (!model) {
            return next(errorHandler.setUpErrorResponse(req, 404, 'Meet not found', null));
        }
        
        //Post process user data
        
        if (model._meetHost instanceof UserProfile) {
            //Don't care if viewing your own, no need to send your own full profile
            model._meetHost.stripDataForViewOtherUserLight();
        }
        
        _.forEach(model.attendees, function (e, i, list) {
            if (e instanceof UserProfile) {
                e.stripDataForViewOtherUserLight();
            }
        });
        
        _.forEach(model.bannedAttendees, function (e, i, list) {
            if (e instanceof UserProfile) {
                e.stripDataForViewOtherUserLight();
            }
        });

        req.result = model;

        return next();
    });
}

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
    
    //Todo: many input validations...
    
    var startTimeUtc = moment(req.body.startTimeUtc);
    

    var newMeet = new Meet({
        title: req.body.title,
        startTimeUtc: startTimeUtc,
        lengthMinutes: req.body.lengthMinutes,
        pictures: [],
        location: {
            lat: req.body.location.lat,
            long: req.body.location.long,
        },
        interests: req.body.interests,
        attendeeSpace : req.body.maxCapacity,
        maxCapacity : req.body.maxCapacity,
        attendeeCriteria : {
            genders: req.body.attendeeCriteria.genders,
            minAge : req.body.attendeeCriteria.minAge,
            maxAge : req.body.attendeeCriteria.maxAge,
        },
        attendees: [],
        bannedAttendees: [],
        attendeeStatus : {},
        status: 'active',
        _meetHost: req.userProfile._id,
        userCreationId : req.body.userCreationId,
        creationTime: Date.now(),
    });
    
    _.forEach(req.body.pictures, function (e, i, list) {
        var pic = {
            uri: e,
            metadata: { source: 'host'}
        };
        newMeet.pictures.push(pic);
    });
    
    var newMeetHub = new MeetHub({
        description: req.body.description,
        creationTime: newMeet.creationTime,
        parentMeetInitialScheduledTime: newMeet.startTimeUtc,
    });
    
    var createReturnResultFromMeet = function (someMeet){
        return {
            id: someMeet._id
        };
    }
    
    var existingMeet = null;
    var savedMeetHub = null;
    
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
                if (existingMeet._meetHost != req.userProfile._id) {
                    return callback(errorHandler.setUpErrorResponse(req, 401, 'This meet has been created already by another user.', null));
                }

                result = createReturnResultFromMeet(existingMeet);

                return callback(breakAsync);
            }

            return callback();
        },
        //Adding a new meet hub
        function (callback){
            newMeetHub.save(function (e, savedModel) { 
                if (e) {
                    errorHandler.setUpErrorResponse(req, 500, 'Error saving new meet hub', e);
                    return callback(e);
                }

                if (!savedModel) {
                    return callback(errorHandler.setUpErrorResponse(req, 500, 'Meet Hub was not created.', null));
                }

                savedMeetHub = savedModel;

                return callback();
            });
        },
        //Adding a new meet
        function (callback){
            newMeet._meetHub = savedMeetHub._id;
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