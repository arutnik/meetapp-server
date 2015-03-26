//Model for a user's profile data.

// Load required packages
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
            type: { type: String, required: true }
        }],
    homeLocation : {
        lat: { type: mongoose.Schema.Types.Double, required: true },
        long: { type: mongoose.Schema.Types.Double, required: true }
    },
    interests : [String],
    meets : [
        {
            _meet: { type: mongoose.Schema.Types.ObjectId, ref: 'Meet' },
            userStatus : { type: String, required: true }
        }
    ]
});

UserProfileSchema.post('init', function (callback) {
    var user = this;
    
    user.age = Date.now - user.dob;
});

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
};

//Show what the local user should see when viewing other 'detail' profile
UserProfileSchema.methods.stripDataForViewOtherUserDetailed = function () {
    this._user = undefined;
    this.realName = undefined;
    this.dob = undefined;
    this.homeLocation = undefined;
};

// Export the Mongoose model
module.exports = mongoose.model('UserProfile', UserProfileSchema);