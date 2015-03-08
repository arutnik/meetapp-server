// Create endpoint /api/beers/:beer_id for GET
exports.getTest = function (req, res, next) {
    // Use the Beer model to find a specific beer
    
    req.result = { message : "hello world" };

    return next();
};