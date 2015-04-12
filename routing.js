

//Load controllers
var authController = require('./controllers/auth.js');
var userController = require('./controllers/user.js');
var meetController = require('./controllers/meet.js');
var meetFeedController = require('./controllers/meetFeed.js')

var addUserProfileMiddleware = require('./middleware/addUserProfile.js');

var configureRoutes = function (app, router) {


    router.route('/user/register/fb')
        .post(userController.registerWithFb);
    router.route('/user/registerdebug')
        .post(userController.registerDebug);
    router.route('/user/:user_id')
        .get(authController.isAuthenticated, userController.getUser)
        .post(authController.isAuthenticated, addUserProfileMiddleware.withoutMeets, userController.updateUserProfile);
   
    
    router.route('/userdebug')
       .get(userController.getUsers);
     //   .delete(userController.deleteAll);
    
    router.route('/meets')
        .post(authController.isAuthenticated, addUserProfileMiddleware.withoutMeets, meetController.createMeet);
    
    router.route('/meets/:meet_id')
        .get(authController.isAuthenticated, meetController.getMeet)
        .post(authController.isAuthenticated, addUserProfileMiddleware.withoutMeets, meetController.updateMeet);
    
    router.route('/meets/:meet_id/join')
        .post(authController.isAuthenticated, addUserProfileMiddleware.withoutMeets, meetController.joinMeet);
    
    router.route('/meets/:meet_id/leave')
        .post(authController.isAuthenticated, addUserProfileMiddleware.withoutMeets, meetController.leaveMeet);
    
    router.route('/meets/:meet_id/ban')
        .post(authController.isAuthenticated, addUserProfileMiddleware.withoutMeets, meetController.banAttendee);
    
    router.route('/meets/:meet_id/unban')
        .post(authController.isAuthenticated, addUserProfileMiddleware.withoutMeets, meetController.unBanAttendee);
    
    router.route('/meetsfeed')
        .get(authController.isAuthenticated, addUserProfileMiddleware.withMeets, meetFeedController.getNextMeetFeedResults);
    
    // Register all our routes with /api
    app.use('/api', router);

};

module.exports.configureRoutes = configureRoutes;