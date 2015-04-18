//Carries the meet ids that a user has 'rejected' and doesn't want to see
//show up in searches.

// Load required packages
var mongoose = require('mongoose');
var _ = require('underscore');

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

UserRejectedMeetsSchema.statics.rejectMeets = function (userId, meetIds, cb) {

    var userObjectId = mongoose.Types.ObjectId(userId);

    var toPush = _.map(meetIds, function (m) { return { _meet : mongoose.Types.ObjectId(m.meetId) , checkForCleanUpOn : m.checkForCleanUpOn }; });

    this.update({ _userProfile : { $eq : userObjectId } }
    , { $pushAll: { rejectedMeets: toPush } }
    , function (err, model) {
        
        var result = false;
        if (model) {
            result = true;
        }
        
        return cb(err, result);
    });
}

UserRejectedMeetsSchema.statics.removeAll = function (userId, cb) {
    
    var userObjectId = mongoose.Types.ObjectId(userId);
    
    this.update({ _userProfile : userObjectId}
    , { $set: { rejectedMeets: [] } }
    , function (err, model) {
        
        var result = false;
        if (model) {
            result = true;
        }
        
        return cb(err, result);
    });
}


// Export the Mongoose model
module.exports = mongoose.model('UserRejectedMeets', UserRejectedMeetsSchema);