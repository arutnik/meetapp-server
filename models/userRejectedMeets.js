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

UserRejectedMeetsSchema.statics.getOrCreateForUser = function (userId, cb) {
    
    var userObjectId = mongoose.Types.ObjectId(userId);

    this.collection.findAndModify(
        { _userProfile : userObjectId },
        [],
        {
            $setOnInsert : { _userProfile : userObjectId, rejectedMeets : new Array() }
        },
        {
            new: true,
            upsert: true,
        }
        , function (err, model) {

            if (err) return cb(err, null);
        
            return cb(null, model);
        });
}


// Export the Mongoose model
module.exports = mongoose.model('UserRejectedMeets', UserRejectedMeetsSchema);