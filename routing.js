

//Load controllers
var authController = require('./controllers/auth.js');
var userController = require('./controllers/user.js');
var meetController = require('./controllers/meet.js');

var configureRoutes = function (app, router) {


    router.route('/user/register/fb')
        .post(userController.registerWithFb);
   
    
    //router.route('/user')
     //   .get(userController.getUsers)
     //   .delete(userController.deleteAll);
    
    router.route('/meets/create')
        .post(meetController.createMeet);
    
    // Register all our routes with /api
    app.use('/api', router);

};

module.exports.configureRoutes = configureRoutes;