var facebook = require('facebook-sdk');

var myauth = function (req, res, next) {
    
    var error = new Error("nobody can use this");

    next(error);
};

module.exports.neverauth = myauth;