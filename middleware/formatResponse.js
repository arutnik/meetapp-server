
var formatResponse = function (req, res, next) {
    
    var finalResponse =
    {
        responseCode : 404,
        message : 'Endpoint not found',
        result : null,
    };
    
    if (req.result) {
        finalResponse.responseCode = 200;
        finalResponse.result = req.result;
        finalResponse.message = null;
    }
    else if (req.responseCode) {
        
        finalResponse.responseCode = Math.abs(parseInt(req.statusCode));
        
        finalResponse.message = req.statusMessage || null;
    }
    
    finalResponse.success = finalResponse.responseCode > 199 && finalResponse.responseCode < 400;
    
    res.status(finalResponse.responseCode).send(finalResponse);
    
    return next();
};

module.exports.createErrorResponse = function (req) {
    
    var responseCode = (("responseCode" in req) && req.responseCode) ? Math.abs(parseInt(req.responseCode)) : 500;
    
    var message = (("statusMessage" in req) && req.statusMessage) ? req.statusMessage : "Internal Server Error";

    var r =
    {
        responseCode : responseCode,
        message : message,
        result : null,
        success : false,
    };
    return r;
};

module.exports.formatResponse = formatResponse;