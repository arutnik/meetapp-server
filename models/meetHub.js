//Model for a meet's basic data for use in search results and linking

// Load required packages
var mongoose = require('mongoose');

var MeetHubSchema = new mongoose.Schema({
    
    attendees : [
        {
            _userProfile: { type: Objectid, ref: 'UserProfile' },
            userStatus : { type: String, required: true }
        }
    ],
    conversationPosts : [
        {
            id : { type: String, required: true },
            text: { type: String, required: true },
            attendeeId: { type: Number, required: true },
            time: { type: Date, required: true },
            comments: [
                {
                    id : { type: String, required: true },
                    text: { type: String, required: true },
                    attendeeId: { type: Number, required: true },
                    time: { type: Date, required: true }
                }
            ]
        }
    ]
});

// Export the Mongoose model
module.exports = mongoose.model('MeetHub', MeetSchema);