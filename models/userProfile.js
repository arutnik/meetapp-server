//Model for a user's profile data.

// Load required packages
var mongoose = require('mongoose');

// Define our user schema
var UserProfileSchema = new mongoose.Schema({
    _user : { type: ObjectId, ref: 'User' },
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
        lat: { type: Double, required: true },
        long: { type: Double, required: true }
    },
    interests : [String],
    meets : [
        {
            _meet: { type: Objectid, ref: 'Meet' },
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
    this._realName = undefined;
    this._dob = undefined;
    this._homeLocation = undefined;
    this._interests = undefined;
    this._bio = undefined;
    this._meets = undefined;
};

//Show what the local user should see when viewing other 'detail' profile
UserProfileSchema.methods.stripDataForViewOtherUserDetailed = function () {
    this._user = undefined;
    this._realName = undefined;
    this._dob = undefined;
    this._homeLocation = undefined;
};

// Export the Mongoose model
module.exports = mongoose.model('UserProfile', UserProfileSchema);