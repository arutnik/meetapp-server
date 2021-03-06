﻿//Model for a meet's basic data for use in search results and linking
//Ensure dependent models loaded
var meetFeed = require('./meetFeed.js');
var _ = require('underscore');

// Load required packages
var mongoose = require('mongoose');
require('mongoose-double')(mongoose);

var MeetSchema = new mongoose.Schema({
    _meetHub : {  type: mongoose.Schema.ObjectId, ref: 'MeetHub'  },
    _meetHost: { type: mongoose.Schema.ObjectId, ref: 'UserProfile' },
    hostAge : { type: Number, required: true },//years
    hostGender : { type: String, required: true },
    creationTime : { type: Date, required: true },
    title : { type: String, required: true },
    status : { type: String, required: true },
    startTimeUtc : { type: Date, required: true },
    lengthMinutes : { type: Number, required: true },
    pictures : [
        {
            uri: { type: String, required: true },
            metadata: { type: mongoose.Schema.Types.Mixed, required: true }
        }],
    location : {
        type: [Number],  // [<longitude>, <latitude>]
        index: '2d'      // create the geospatial index
    },
    interests : [String],
    attendees : [{ type: mongoose.Schema.Types.ObjectId, ref: 'UserProfile' }],//Just user user ids
    bannedAttendees : [{ type: mongoose.Schema.Types.ObjectId, ref: 'UserProfile' }],
    attendeeSpace : { type: Number, required: true },
    attendeeStatus : { type: mongoose.Schema.Types.Mixed, required: true  },
    maxCapacity : { type: Number, required: true },
    attendeeCriteria : {
        genders: [String],
        minAge: { type: Number, required: true },
        maxAge: { type: Number, required: true},
    },
    userCreationId : { type: String, required: true }
});

MeetSchema.statics.getNextMeetFeedResults = meetFeed.getNextMeetFeedResults;

MeetSchema.statics.changeMaxCapacity = function reduceMaxCapacity(meetId, oldMaxCapacity, newMaxCapacity, cb)
{
    var meetObjectId = mongoose.Types.ObjectId(meetId);

    if (newMaxCapacity === oldMaxCapacity) {
        var error = new Error("invalid arguments");
        return cb(error, false);
    }

    var difference = newMaxCapacity - oldMaxCapacity;
    
    var updateCondition = {};
    updateCondition._id = meetObjectId;
    
    if (difference < 0) {
        updateCondition.attendeeSpace = { $gte : difference * -1 };
    }

    this.update(updateCondition
    , { $inc: { attendeeSpace: difference }, $set: { maxCapacity : newMaxCapacity } }
    , function (err, model) {
        
        var result = false;
        if (model) {
            result = true;
        }
        
        return cb(err, result);
    });
}

MeetSchema.methods.getLocLat = function (){
    return this.location[1];
}

MeetSchema.methods.setLocLat = function(lat) {
    this.location[1] = lat;
}

MeetSchema.methods.getLocLong = function (){
    return this.location[0];
}

MeetSchema.methods.setLocLong = function (long){
    this.location[0] = long;
}

MeetSchema.statics.joinMeetIfRoom = function joinMeet(meetId, userId, cb) {
    
    var meetObjectId = mongoose.Types.ObjectId(meetId);
    var userObjectId = mongoose.Types.ObjectId(userId);
    
    var attendeeStatusPropertyName = 'attendeeStatus.' + userId;
    
    var setOperator = {};
    setOperator[attendeeStatusPropertyName] = 'att';

    this.update({ _id : meetObjectId, attendeeSpace : { $gt: 0 }, _meetHost : { $ne: userObjectId }, 'attendees' : { $ne: userObjectId }, 'bannedAttendees' : { $ne: userObjectId }, }
    , { $push: { attendees: userObjectId }, $inc: { attendeeSpace: -1 }, $set: setOperator }
    , function (err, model) {
        
        var result = false;
        if (model) {
            result = true;
        }

        return cb(err, result);
    });
};

MeetSchema.statics.leaveMeet = function leaveMeet(meetId, userId, cb) {

    var meetObjectId = mongoose.Types.ObjectId(meetId);
    var userObjectId = mongoose.Types.ObjectId(userId);

    var attendeeStatusPropertyName = 'attendeeStatus.' + userId;

    var setOperator = {};
    setOperator[attendeeStatusPropertyName] = 'left';

    this.update({ _id : meetObjectId, 'attendees' : { $eq: userObjectId } }
    , { $pull : { attendees : userObjectId }, $set: setOperator, $inc : { attendeeSpace: 1 } }
    , function (err, model) {

        var result = false;
        if (model) {
            result = true;
        }
        
        return cb(err, result);

    });

};

MeetSchema.statics.banAttendee = function banAttendee(meetId, bannedUserId, cb) {

    var meetObjectId = mongoose.Types.ObjectId(meetId);
    var userObjectId = mongoose.Types.ObjectId(bannedUserId);

    var attendeeStatusPropertyName = 'attendeeStatus.' + bannedUserId;
    
    var setOperator = {};
    setOperator[attendeeStatusPropertyName] = 'banned';

    this.update({ _id : meetObjectId, 'attendees' : { $eq: userObjectId } }
    , { $pull : { attendees : userObjectId }, $push: { bannedAttendees: userObjectId }, $set: setOperator, $inc : { attendeeSpace: 1 } }
    , function (err, model) {
        
        var result = false;
        if (model) {
            result = true;
        }
        
        return cb(err, result);

    });
};

//Unbans, but does not add them back to attending
MeetSchema.statics.unBanAttendee = function banAttendee(meetId, bannedUserId, cb) {
    
    var meetObjectId = mongoose.Types.ObjectId(meetId);
    var userObjectId = mongoose.Types.ObjectId(bannedUserId);
    
    var attendeeStatusPropertyName = 'attendeeStatus.' + bannedUserId;
    
    var setOperator = {};
    setOperator[attendeeStatusPropertyName] = 'unbanned';
    
    this.update({ _id : meetObjectId, 'bannedAttendees' : { $eq: userObjectId } }
    , { $pull : { bannedAttendees : userObjectId }, $set: setOperator, }
    , function (err, model) {
        
        var result = false;
        if (model) {
            result = true;
        }
        
        return cb(err, result);

    });
};

MeetSchema.methods.stripUserDataForLightView = function () {

    if (this._meetHost && typeof this._meetHost.stripDataForViewOtherUserLight == 'function') {
        //Don't care if viewing your own, no need to send your own full profile
        this._meetHost.stripDataForViewOtherUserLight();
    }
    
    _.forEach(this.attendees, function (e, i, list) {
        if (e && typeof e.stripDataForViewOtherUserLight == 'function') {
            e.stripDataForViewOtherUserLight();
        }
    });
    
    _.forEach(this.bannedAttendees, function (e, i, list) {
        if (e && typeof e.stripDataForViewOtherUserLight == 'function') {
            e.stripDataForViewOtherUserLight();
        }
    });

};

// Export the Mongoose model
module.exports = mongoose.model('Meet', MeetSchema);

