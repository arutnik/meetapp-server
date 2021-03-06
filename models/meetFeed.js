﻿var moment = require('moment');
var Meet = require('./meet.js');
var _ = require('underscore');
//A set of extension methods on the meet schema that allow getting results from the 'meet feed'

var getLocationQueryObject = function (lat, long, distanceKm)
{
    // 
    var maxDistance = distanceKm;
    
    // we need to convert the distance to radians
    // the raduis of Earth is approximately 6371 kilometers
    maxDistance /= 6371;
    
    // get coordinates [ <longitude> , <latitude> ]
    var coords = [];
    coords[0] = long;
    coords[1] = lat;
    
    // find a location
    var result = {
        $near: coords,
        $maxDistance: maxDistance
    };

    return result;
};

module.exports.getNextMeetFeedResults = function (userProfile, userRejectedMeets, queryLimit, cb){
    var db = this; //should get set to Meet db.
    
    var usc = userProfile.searchCriteria;
    
    var queryCondition = {};
    
    queryCondition.maxCapacity = { $gt : 0 };
    
    //Query must match searcher's criteria
    
    queryCondition.location = getLocationQueryObject(userProfile.homeLocation.lat.value, userProfile.homeLocation.long.value, usc.maxDistanceKm);
    
    queryCondition.hostAge = {
        $gte: usc.minHostAge,
        $lte: usc.maxHostAge
    };
    
    if (usc.matchesInterests.length > 0) {
        queryCondition.interests = { $in : usc.matchesInterests };
    }
    
    if (usc.acHostGenders.length > 0) {
        queryCondition.hostGender = { $in: usc.acHostGenders };
    }
    
    if (usc.minHoursToEventStart != null || usc.maxHoursToEventStart != null) {
        queryCondition.startTimeUtc = {};
        var now = new Date(Date.now());
        if (usc.minHoursToEventStart != null) {
            
            var date = moment.utc();
            date.add(usc.minHoursToEventStart, 'h');

            queryCondition.startTimeUtc.$gte = date.toDate();
        }

        if (usc.maxHoursToEventStart != null) {
            
            var date = moment.utc();
            date.add(usc.maxHoursToEventStart, 'h');
            
            queryCondition.startTimeUtc.$lte = date.toDate();
        }
    }
    
    //Query must match poster's criteria
    
    var userGenders = [];
    userGenders.push(userProfile.gender)
    
    //queryCondition.attendeeCriteria = {};
    queryCondition['attendeeCriteria.genders'] = {
        $in : userGenders
    };
    queryCondition['attendeeCriteria.minAge'] = {
        $lte: userProfile.age
    };
    queryCondition['attendeeCriteria.maxAge'] = {
        $gte: userProfile.age
    };
    
    //Build a blacklist of meet id's.
    
    var meetIdBlackList = _.pluck(userRejectedMeets.rejectedMeets, '_meet');
    
    //Look through the loaded meet list.
    
    //Remove ones your hosting
    
    _.forEach(userProfile.meets, function (e, i, lst) {

        if (!("_meetHost" in e))
            return;//continue

        //reject if you're the host
        var userMeet = e;

        if (userProfile._id.equals(userMeet._meetHost)) {
            meetIdBlackList.push(userMeet._id);
            return;
        }

        if (!("attendeeStatus" in userMeet) || !(userMeet.attendeeStatus))
            return;

        if (!(userProfile.id in userMeet.attendeeStatus))
            return;

        var userStatusInMeet = userMeet.attendeeStatus[userProfile.id];

        if (!userStatusInMeet)
            return;

        if (userStatusInMeet === 'att' || userStatusInMeet === 'banned') {
            meetIdBlackList.push(userMeet._id);
            return;
        }
    });

    if (meetIdBlackList.length > 0) {
        queryCondition._id = { $nin: meetIdBlackList };
    }
    
    db.find(queryCondition)
    .populate('_meetHost')
    .limit(queryLimit)
    .exec(function (err, models) {
        if (err)
            return cb(err, null);

        return cb(err, models);
    });
}