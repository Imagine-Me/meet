# Meet

`Meet` is an React application created for video chat with you friends just like google meet. This application uses and requires webRTC.

In order to make a connection between two peers, we need a signalling server in between. For this project I have created a signalling server using node, socket.io and mongoDB, this can be found here

[Signlling server](https://github.com/Imagine-Me/meet-backend)

For the ease of creating front-end I have used Material-ui

### Authentication

For authentication Firebase google authentication is used.


## Running application

##### Setup firebase
Since the  authentication is done using firebase you have create an app in firebase and use its credentials in this app. You can find `.env.sample` in repo. Create a new `.env` file and copy everything from `.env.sample` and add you credentials. That should be it!

##### Signalling server
As mentioned above you will need a signalling server for the initial connection between two peers. Code for the signalling server can be found [here](https://github.com/Imagine-Me/meet-backend). Follow the instructions in README of the repo to setup the signalling server.

##### Install required packages

```
npm i  
```
This will install all the packages required for the app.


##### Starting server

```
npm start
```
This will start app in your localhost