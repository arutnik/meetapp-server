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

// Create endpoint /api/meets/:meet_id for POST
exports.updateMeet = function (req, res, next) {

    var setOperation = {};

    
    var needSaveHub = false;
    var needSaveMain = false;
    var needChangeCapacity = false;
    var newMaxCapacity = 0;
    var result = { saved : true };
    var existingMeet = null;
    
    async.series([
        function (callback){
            Meet.findOne({ _id : req.params.meet_id })
            .populate('_meetHub')
            .exec(function (err, model) {
                existingMeet = model;
                
                if (err) {
                    return callback(err);
                }
                
                if (!model) {
                    return callback(errorHandler.setUpErrorResponse(req, 404, "Meet not found"));
                }
                
                if (!model._meetHost.equals(req.userProfile._id)) {
                    return callback(errorHandler.setUpErrorResponse(req, 401, "Not authorized to edit this meet"));
                }
                
                return callback();
            });
        },
        //Update data
        function (callback){

            if ("title" in req.body && req.body.title != existingMeet.title) {
                needSaveMain = true;
                existingMeet.title = req.body.title;
            }

            if ("startTimeUtc" in req.body) {
                var date = moment(req.body.startTimeUtc).toDate();
                var oldDate = existingMeet.startTimeUtc;
                var diff = date - oldDate;
                if (!(diff === 0)) {
                    needSaveMain = true;
                    existingMeet.startTimeUtc = date;
                }
            }

            if ("lengthMinutes" in req.body && req.body.lengthMinutes != existingMeet.lengthMinutes) {
                needSaveMain = true;
                existingMeet.lengthMinutes = req.body.lengthMinutes;
            }

            if ("location" in req.body && (req.body.location.lat != existingMeet.getLocLat() || req.body.location.long != existingMeet.getLocLong())) {
                needSaveMain = true;
                existingMeet.setLocLat(req.body.location.lat);
                existingMeet.setLocLong(req.body.location.long);
            }

            if ("attendeeCriteria" in req.body) {
                
                var gendersDifference = _(req.body.attendeeCriteria.genders).difference(existingMeet.attendeeCriteria.genders);
                
                if (gendersDifference.length > 0) {
                    needSaveMain = true;
                    existingMeet.attendeeCriteria.genders = req.body.attendeeCriteria.genders;
                }

                if (req.body.attendeeCriteria.minAge != existingMeet.attendeeCriteria.minAge 
                    || req.body.attendeeCriteria.maxAge != existingMeet.attendeeCriteria.maxAge) {
                    
                    needSaveMain = true;
                    existingMeet.attendeeCriteria.minAge = req.body.attendeeCriteria.minAge;
                    existingMeet.attendeeCriteria.maxAge = req.body.attendeeCriteria.maxAge;
                }
            }

            if ("description" in req.body && existingMeet._meetHub.description != req.body.description) {
                existingMeet._meetHub.description = req.body.description;
                needSaveHub = true;
            }
            
            if ("pictures" in req.body) {

                var oldPictureUrls = _.pluck(existingMeet.pictures, 'uri');

                var picDifferences = _(oldPictureUrls).difference(req.body.pictures);

                if (picDifferences.length > 0) {
                    needSaveMain = true;
                    existingMeet.pictures = [];
                    _.forEach(req.body.pictures, function (e, i, list) {
                        var pic = {
                            uri: e,
                            metadata: { source: 'host' }
                        };
                        existingMeet.pictures.push(pic);
                    });
                }

            }
            
            if ("maxCapacity" in req.body) {
                if (req.body.maxCapacity != existingMeet.maxCapacity) {
                    needChangeCapacity = true;
                    newMaxCapacity = req.body.maxCapacity;
                }
            }
            
            if (needSaveMain) {
                existingMeet.save(function (err, m) {
                    if (err) {
                        errorHandler.setUpErrorResponse(req, 500, 'Error updating existing meet', err);
                        return callback(err);
                    }
                    
                    return callback();
                });
            }
            else {
                return callback();
            }
        },
        //save hub
        function (callback){
            if (needSaveHub) {
                existingMeet._meetHub.save(function (err, m) {
                    
                    if (err) {
                        errorHandler.setUpErrorResponse(req, 500, 'Error updating existing meet hub', err);
                        return callback(err);
                    }
                    
                    return callback();
                     
                });
            } else {
                return callback();
            }
        },
        //change capacity
        function (callback) {
            if (needChangeCapacity) {
                Meet.changeMaxCapacity(existingMeet._id, existingMeet.maxCapacity, newMaxCapacity, function (err, didChange) {
                    
                    if (err) {
                        errorHandler.setUpErrorResponse(req, 500, 'Error updating capacity', err);
                        return callback(err);
                    }
                    
                    if (!didChange) {
                        return callback(errorHandler.setUpErrorResponse(req, 410, 'Unable to change capacity due to current attendance.', null));
                    }
                    
                    return callback();
                     
                });
            } else {
                return callback();
            }
        },
    ], function (err) {
        if (err) {
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
        location: [],
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
        hostAge: req.userProfile.age,
        hostGender: req.userProfile.gender,
        userCreationId : req.body.userCreationId,
        creationTime: Date.now(),
    });
    
    //todo find better place for this
    newMeet.location.push(req.body.location.long);
    newMeet.location.push(req.body.location.lat);
    
    newMeet.attendeeStatus[req.userProfile.id] = 'host';
    
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

    
};