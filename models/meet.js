//Model for a meet's basic data for use in search results and linking
//Ensure dependent models loaded
//var UserProfile = require('./userProfile.js');
//var MeetHub = require('./meetHub.js');

// Load required packages
var mongoose = require('mongoose');
require('mongoose-double')(mongoose);

var MeetSchema = new mongoose.Schema({
    _meetHub : {  type: mongoose.Schema.ObjectId, ref: 'MeetHub'  },
    _meetHost: {  type: mongoose.Schema.ObjectId, ref: 'UserProfile'  },
    title : { type: String, required: true },
    status : { type: String, required: true },
    startTimeUtc : { type: Date, required: true },
    lengthMinutes : { type: Number, required: true },
    pictures : [
        {
            uri: { type: String, required: true },
            type: { type: String, required: true }
        }],
    location : {
        lat: { type:mongoose.Schema.Types.Double, required: true },
        long: { type: mongoose.Schema.Types.Double, required: true }
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

MeetSchema.methods.stripDataForReturn = function () {
    
};

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

// Export the Mongoose model
module.exports = mongoose.model('Meet', MeetSchema);

