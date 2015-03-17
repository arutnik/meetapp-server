var Meet = require('../models/meet.js');
var errorHandler = require('../errorHandler');
var async = require('async');

exports.createMeet = function (req, res, next) {

    var newMeet = new Meet({
        title: req.body.title,
        status: 'active',
        startTimeUtc: Date.now(),
        lengthMinutes: 1,
        pictures: [],
        location: { lat: 1.0, long: 1.0 },
        interests: [],
        attendees: [],
        bannedAttendees: [],
        attendeeCount : 0,
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
        if (err != breakAsync) {
            return next(err);
        }
        
        req.result = result;

        return next();
    });

    
};