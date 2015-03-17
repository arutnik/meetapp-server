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
    attendees : [mongoose.Schema.Types.ObjectId],//Just user user ids
    bannedAttendees : [mongoose.Schema.Types.ObjectId],
    attendeeCount : { type: Number, required: true },
    attendeeStatus : { type: mongoose.Schema.Types.Mixed, required: true  },
    maxCapacity : { type: Number, required: true },
    attendeeCriteria : {
        genders: [String],
        minAge: { type: Number, required: true },
        maxAge: { type: Number, required: true},
    },
    userCreationId : { type: String, required: true }
});

// Export the Mongoose model
module.exports = mongoose.model('Meet', MeetSchema);

var func = function (meetId, cb) {
    var db = module.exports;

    //db.update({ Id : meetId, $where: "this.attendeeCount <= attendees.length"}, 
};

