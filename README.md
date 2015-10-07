#meetapp-server
This repository contains the code for the back-end server for an application that I code-named 'meetapp'. The idea was an app that would let users post get-togethers or 'meets' with specific criteria on on who would be able to join such as group size, attendee age and gender. In turn, other users would be able to search for meets in their local area where they satisfied attendee criteria. In short, it's an app to find some people to go biking or rock climbing with.

#Technology
The server is built on Node.JS with Mongoose handling the database. A variety of npm packages:

1. async
2. passport
3. underscore

#Tools Required To Build/Run
These tools and subscriptions will be needed to build the application:
1. Node.JS
2. Mongodb

#Project Layout

controlers/
-Controller contain the business logic for each REST endpoint

middleware/
-Functions that are injected into endpoints to support common tasks such as logging, authorization, and data return formatting.

models/
-Mongoose schema definitions and some helper functions.

#API
The API supports logging in/creating an account with Facebook, updating profile/preferences information, searching for, creating and joining meets. Some endpoints are highlighted below:

userController.registerWithFb
-Registers a new user or returns login information for an existing user that registered with Facebook

userController.updateUserProfile
-Given a json user profile, updates that user's profile information in the database.

meetController.createMeet
-Given the json description of a meet and its attendee criteria, creates a new meet in the database making it available for searches and joins.

meetController.joinMeet
-As a user, joins a meet. No attendee criteria is checked except whether there is room.

meetFeedController.rejectMeets
-Adds a set of meet id's to a blacklist for that user so they won't show up in search results. This facilitates and endless 'swipe left/right' feed that continues where user last left off.

meetFeedController.getNextMeetFeedResults
-Gets the most relevant meets where everyone's criteria are satisfied.

#Future Considerations

1. Security Concerns
Authentication is only done in basic right now, and the user's credentials are returned plain from the Facebook log in call. This endpoint in particular should use SSL.

2. Database Schema
Some operations are meant to be 'atomic' like joining a meet so the attendee list doesn't blow past the limit. This is done using update calls with criteria. This may not work well in a distributed DB environment.

#Building and running the application

1. Ensure mongodb instance is running at mongodb://localhost:27017/pma_appdata
2. npm install
3. node server.js
