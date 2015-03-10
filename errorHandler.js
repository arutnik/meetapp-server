module.exports.setUpErrorResponse = function (req, statusCode, msg, sourceError) {
    req.responseCode = statusCode;
    req.statusMessage = msg;

    return new Error(msg);
};