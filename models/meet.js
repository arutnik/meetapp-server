//Model for a meet's basic data for use in search results and linking

// Load required packages
var mongoose = require('mongoose');

var MeetSchema = new mongoose.Schema({
    _meetHub : { type: ObjectId, ref: 'MeetHub' },
    _meetHost: { type: Objectid, ref: 'UserProfile' },
    title : { type: String, required: true },
    status : { type: String, required: true },
    startTimeUtc : { Type: Date, required: true },
    lengthMinutes : { Type: Int, required: true },
    pictures : [
        {
            uri: { type: String, required: true },
            type: { type: String, required: true }
        }],
    location : {
        lat: { type: Double, required: true },
        long: { type: Double, required: true }
    },
    interests : [String],
    
    attendeeCriteria : {
        genders: [String],
        minAge: { Type: Int, required: true },
        maxAge: { Type: Int, required: true},
    },
    userCreationId : { type: String, required: true }
});

// Export the Mongoose model
module.exports = mongoose.model('Meet', MeetSchema);