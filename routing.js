

//Load controllers
var authController = require('./controllers/auth.js');
var userController = require('./controllers/user.js');
var meetController = require('./controllers/meet.js');

var addUserProfileMiddleware = require('./middleware/addUserProfile.js');

var configureRoutes = function (app, router) {


    router.route('/user/register/fb')
        .post(userController.registerWithFb);
    router.route('/user/registerdebug')
        .post(userController.registerDebug);
   
    
    //router.route('/user')
     //   .get(userController.getUsers)
     //   .delete(userController.deleteAll);
    
    router.route('/meets/create')
        .post(authController.isAuthenticated, addUserProfileMiddleware, meetController.createMeet);
    
    router.route('/meets/:meet_id/join')
        .post(authController.isAuthenticated, addUserProfileMiddleware, meetController.joinMeet);
    
    router.route('/meets/:meet_id/leave')
        .post(authController.isAuthenticated, addUserProfileMiddleware, meetController.leaveMeet);
    
    router.route('/meets/:meet_id/ban')
        .post(authController.isAuthenticated, addUserProfileMiddleware, meetController.banAttendee);
    
    router.route('/meets/:meet_id/unban')
        .post(authController.isAuthenticated, addUserProfileMiddleware, meetController.unBanAttendee);
    
    // Register all our routes with /api
    app.use('/api', router);

};

module.exports.configureRoutes = configureRoutes;