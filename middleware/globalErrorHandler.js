var formatResponse = require('./formatResponse.js');

module.exports.globalErrorHandler = function (err, req, res, next) {
    console.error(err.stack);
    
    var finalResponse = formatResponse.createErrorResponse(req);
    
    res.status(finalResponse.responseCode).send(finalResponse);
};