// Load required packages
var User = require('../models/user');
var UserProfile = require('../models/userProfile')
var errorHandler = require('../errorHandler');
var guids = require('node-uuid');
var https = require('https');
var util = require('util');
var async = require('async');
var moment = require('moment');
var _ = require('underscore');

exports.registerDebug = function (req, res, next) {
    var user = new User({
        pmaUserId: req.body.userId,
        password: req.body.password 
    });

    user.socialNetworkLinks = {
        hasLinkedFb : false,
        fbId : "",
    };

    user.save(function (err, newUser) {
        if (err) {
            errorHandler.setUpErrorResponse(req, 500, 'Error saving user.', err);
            return next(err);
        }

        var userProfile = new UserProfile({
            _user: newUser._id,
            realName : { firstName: 'debug', lastName: 'jones' },
            dob: moment.utc().toDate(),
            displayName: 'coolguy',
            bio: '..',
            gender: 'm',
            pictures: [],
            homeLocation: { lat: 10, long: 10 },
            interests: [],
            meets : [],
        });

        userProfile.save(function (perr, newProfile) { 
            if (perr) {
                errorHandler.setUpErrorResponse(req, 500, 'Error saving user.', perr);
                return next(perr);
            }

            req.result = {};
            req.result.user = newUser;
            req.result.profile = newProfile;

            return next();
        });
    });
}

exports.registerWithFb = function (req, res, next) {
    
    if (!("fbId" in req.body) || !("fbAccessToken" in req.body) || !("fbUser" in req.body)) {
        return next(errorHandler.setUpErrorResponse(req, 400, "Missing data in request body", null));
    }

    var user = new User({
        pmaUserId: guids.v4()
    });
    
    user.socialNetworkLinks = {
        hasLinkedFb : true,
        fbId : req.body.fbId,
    };
    
    var graphUrl = util.format("https://graph.facebook.com/me?fields=id&access_token=%s", req.body.fbAccessToken);
    
    var graphResponseBody = '';
    var existingUser = {};
    var existingUserProfile = null;
    var breakAsync = { break: true };
    
    async.series([
        //Start http request
        function (callback){
            https.get(graphUrl, function (res) {

                res.on('data', function (chunk) {
                    graphResponseBody += chunk;
                });
                
                res.on('end', function () {
                    return callback();//Go to next step in series
                });
            }).on('error', function (e) {
                errorHandler.setUpErrorResponse(req, 401, 'Error reaching third party authentication', e);
                return callback(e);
            });
        },
        //Handle output of http request
        function (callback){
            var fbResponse = JSON.parse(graphResponseBody)
            console.log("Got response: ", fbResponse.id);
            
            if (user.socialNetworkLinks.fbId != fbResponse.id) {
                return callback(errorHandler.setUpErrorResponse(req, 400, "Access token was not valid for supplied user id.", null));
            }

            //Look for existing user with same fbid first.
            //This is secure, because to get an access token you
            //already need control of the fb account
            
            User.findOne({ 'socialNetworkLinks.fbId': user.socialNetworkLinks.fbId }, function (err, u) {

                if (err) {
                    errorHandler.setUpErrorResponse(req, 500, 'Error looking up user.', err);
                    return callback(err);
                }
                    
                existingUser = u;
                return callback();
            });
        },
        //Handle result of finding user
        function (callback){

            if (existingUser) {
                req.statusMessage = 'Existing user returned!';
                user = existingUser;
            }
            else {
                req.statusMessage = 'Adding new user returned!';
            }
            
            req.result = {};
            
            //Whether adding new, or returning existing, generate new password and save it.
            
            user.password = guids.v4();
            
            var returnedUserView = {
                userId : user.pmaUserId,
                password : user.password,
            };
            
            user.save(function (err) {
                if (err) {
                    errorHandler.setUpErrorResponse(req, 500, 'Error saving user.', err);
                    return callback(err);
                }
                
                
                
                req.result = returnedUserView;
                return callback();
            });
        },
        //Get User Profile
        function (callback)
        {
            UserProfile.getForUser(existingUser._id, function (err, model) {
                if (err) {
                    errorHandler.setUpErrorResponse(req, 500, 'Error getting user profile.', err);
                    return callback(err);
                }

                if (model) {
                    req.result.userProfileId = model.id;
                    return callback(breakAsync);
                }

                return callback();
            });
        },
        //Create new user Profile
        function (callback)
        {
            var newUserProfile = new UserProfile({
                _user: existingUser._id,
                realName : { firstName: req.body.fbUser.firstName, lastName: req.body.fbUser.lastName },
                dob: new Date(1000,1,1),
                displayName: req.body.fbUser.firstName + ' ' + req.body.fbUser.lastName,
                bio: ' ',
                gender: req.body.fbUser.gender,
                pictures: [],
                homeLocation: { lat: 0, long: 0 },
                interests: [],
                meets : [],
                searchCriteria : {
                    minHostAge: 0,
                    maxHostAge: 0,
                    maxDistanceKm: 0,
                }
            });

            newUserProfile.save(function (err, nu) {

                if (err) {
                    errorHandler.setUpErrorResponse(req, 500, 'Error creating user profile.', err);
                    return callback(err);
                }
                
                if (nu) {
                    req.result.userProfileId = nu.id;
                    return callback(breakAsync);
                }

            });
        }
    ], function (err) {

        if (err && err != breakAsync) return next(err);

        return next();
    });
};

// Create endpoint /api/users/:user_id for GET
exports.getUser = function (req, res, next) {
    


    UserProfile.findById(req.params.user_id)
    .populate('meets')
    .exec(function (err, model) {

        if (err) {
            errorHandler.setUpErrorResponse(req, 500, 'Error getting user.', err);
            return next(err);
        }

        if (!model) {
            return next(errorHandler.setUpErrorResponse(req, 404, 'Could not find user.', null));
        }
        
        if (!(model._user.equals(req.user._id))) {
            model.stripDataForViewOtherUserDetailed();
        }
        
        req.result = model;

        return next();
    });
}

// Create endpoint /api/users/:user_id for POST
exports.updateUserProfile = function (req, res, next) {

    if (req.userProfile.id != req.params.user_id) {
        return next(errorHandler.setUpErrorResponse(req, 401, 'Not authorized to change that user.', null));
    }

    if ("realName"in req.body 
        && typeof req.body.realName.firstName == 'string'
        && typeof req.body.realName.lastName == 'string') {
        req.userProfile.realName = req.body.realName;
    }

    if ("dob" in req.body && typeof req.body.displayName == 'string') {
        var newDob = moment.utc(req.body.dob);

        req.userProfile.dob = newDob.toDate();
    }

    if ("displayName" in req.body && typeof req.body.displayName == 'string') {
        req.userProfile.displayName = req.body.displayName;
    }

    if ("bio" in req.body && typeof req.body.bio == 'string') {
        req.userProfile.bio = req.body.bio;
    }

    if ("gender" in req.body && typeof req.body.gender == 'string') {
        req.userProfile.gender = req.body.gender;
    }

    if ("pictures" in req.body && req.body.pictures.constructor === Array) {
        
        var oldPictureUrls = _.pluck(req.userProfile.pictures, 'uri');
        
        var picDifferences = _(oldPictureUrls).difference(req.body.pictures);
        
        if (picDifferences.length > 0 || req.userProfile.pictures.length < req.body.pictures.length) {
            req.userProfile.pictures = [];
            _.forEach(req.body.pictures, function (e, i, list) {
                var pic = {
                    uri: e,
                    metadata: { source: 'self' }
                };
                req.userProfile.pictures.push(pic);
            });
        }

    }

    if ("homeLocation" in req.body) {
        var lat = req.body.homeLocation.lat;
        var long = req.body.homeLocation.long;
        
        var test = typeof lat;

        if (typeof lat == 'number' || typeof lat == 'string') {
            req.userProfile.homeLocation.lat = lat;
        }
        if (typeof long == 'number' || typeof losng == 'string') {
            req.userProfile.homeLocation.long = long;
        }
    }
    
    var t = typeof req.body.interests;

    if ("interests" in req.body && req.body.interests.constructor === Array) {
        req.userProfile.interests = [];
        _.forEach(req.body.interests, function (e, i, list) {
            
            if (typeof e == 'string') {
                req.userProfile.interests.push(e);
            }

        });
    }

    if ("searchCriteria" in req.body) {
        //todo validate this..

        req.userProfile.searchCriteria.minHostAge = req.body.searchCriteria.minHostAge;
        req.userProfile.searchCriteria.maxHostAge = req.body.searchCriteria.maxHostAge;
        req.userProfile.searchCriteria.maxDistanceKm = req.body.searchCriteria.maxDistanceKm;
        req.userProfile.searchCriteria.matchesInterests = req.body.searchCriteria.matchesInterests;
        req.userProfile.searchCriteria.acHostGenders = req.body.searchCriteria.acHostGenders;
        req.userProfile.searchCriteria.minHoursToEventStart = req.body.searchCriteria.minHoursToEventStart;
        req.userProfile.searchCriteria.maxHoursToEventStart = req.body.searchCriteria.maxHoursToEventStart;
    }

    req.userProfile.save(function (err, model) {

        if (err)
            return next(errorHandler.setUpErrorResponse(req, 500, "Unable to save profile", err));
        
        req.result = { saved : true};

        return next();
    });
}

// Create endpoint /api/userdebug for GET
exports.getUsers = function (req, res, next) {
    UserProfile.find({})
    .populate('_user')
    .populate('meets')
    .exec(
    function (err, users) {
            if (err)
                return next(err);
        
            req.result = users;
            return next();
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
