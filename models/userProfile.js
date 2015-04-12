//Model for a user's profile data.

// Load required packages
var moment = require('moment');
var mongoose = require('mongoose');
require('mongoose-double')(mongoose);

// Define our user schema
var UserProfileSchema = new mongoose.Schema({
    _user : { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    realName : {
        firstName : { type: String, required: true },
        lastName : { type: String, required: true },
    },
    dob : { type: Date, required: true },
    displayName : { type: String, required: true },
    bio : { type: String, required: true },
    gender : { type: String, required: true },
    pictures : [
        {
            uri: { type: String, required: true },
            metadata: { type: mongoose.Schema.Types.Mixed, required: true }
        }],
    homeLocation : {
        lat: { type: mongoose.Schema.Types.Double, required: true },
        long: { type: mongoose.Schema.Types.Double, required: true }
    },
    interests : [String],
    meets : [
            { type: mongoose.Schema.Types.ObjectId, ref: 'Meet' }
    ],
    searchCriteria : {
        minHostAge: { type: Number, required: true },
        maxHostAge: { type: Number, required: true },
        maxDistanceKm: { type: mongoose.Schema.Types.Double, required: true },
        matchesInterests: [String],
        acHostGenders: [String],
        minHoursToEventStart: { type: Number, required: false },
        maxHoursToEventStart: { type: Number, required: false }
    }
});

UserProfileSchema.post('init', function (callback) {
    var user = this;
    
    var years = moment().diff(user.dob, 'years'); 
    
    user.age = years;
});

UserProfileSchema.statics.addToUsersMeets = function (userId, meetId, cb){
    
    var userObjectId = mongoose.Types.ObjectId(userId);
    var meetObjectId = mongoose.Types.ObjectId(meetId);

    this.update({ _id : userObjectId }, { $push: { meets : meetObjectId } }, function (err, model) { 

        if (err)
            return cb(err);

        return cb(null);
    });
}

//Show what the local user should see when viewing own profile
UserProfileSchema.methods.stripDataForViewCurrentUser = function () {
    this._user = undefined;
};

//Show what the local user should see when viewing other 'light' profile
UserProfileSchema.methods.stripDataForViewOtherUserLight = function () {
    this._user = undefined;
    this.realName = undefined;
    this.dob = undefined;
    this.homeLocation = undefined;
    this.interests = undefined;
    this.bio = undefined;
    this.meets = undefined;
    this.searchCriteria = undefined;
};

//Show what the local user should see when viewing other 'detail' profile
UserProfileSchema.methods.stripDataForViewOtherUserDetailed = function () {
    this._user = undefined;
    this.realName = undefined;
    this.dob = undefined;
    this.homeLocation = undefined;
    this.searchCriteria = undefined;
};

// Export the Mongoose model
module.exports = mongoose.model('UserProfile', UserProfileSchema);