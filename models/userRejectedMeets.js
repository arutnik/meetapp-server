//Carries the meet ids that a user has 'rejected' and doesn't want to see
//show up in searches.

// Load required packages
var mongoose = require('mongoose');

// Define our user schema
var UserRejectedMeetsSchema = new mongoose.Schema({
    _userProfile : { type: mongoose.Schema.Types.ObjectId, ref: 'UserProfile' },//user profile id
    
    rejectedMeets : [
        {
            _meet: { type: mongoose.Schema.Types.ObjectId, ref: 'Meet' },
            checkForCleanUpOn: { type: Date, required : true }//When this item should be considered to be removed due to irrelevancy
        }
    ]
});


// Export the Mongoose model
module.exports = mongoose.model('UserRejectedMeets', UserRejectedMeetsSchema);