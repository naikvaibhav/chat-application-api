//module dependencies
const socketio = require('socket.io');
const mongoose = require('mongoose');
const shortid = require('shortid');
const logger = require('./loggerLib.js');
const events = require('events');

const eventEmitter = new events.EventEmitter();

const tokenLib = require('./tokenLib.js');
const check = require('./checkLib.js');
const response = require('./responseLib');


let setServer = (server)=>{
    //empty array
    let allOnlineUsers = [];

    //create connection and initialize socketio library
    let io = socketio.listen(server);

    //myIo is collection of pipes
    let myIo = io.of('')
    
    //main event handler
    myIo.on('connection',(socket)=>{
        console.log("on connecttion--emitting verify user");
        //when we want to trigger an event emit is used
        socket.emit('verifyUser',"");

        //code to verify the user and make him online
        //when set-user event occurs  for authToken function

        socket.on('set-user',(authToken)=>{
            console.log('set-user called');
            tokenLib.verifyClaimWithoutSecret(authToken,(err,user)=>{
                if(err){
                    socket.emit('auth-error',{status:500, error: 'Please procide correct auth token'})
                }else{
                    console.log('user is verified..setting details');
                    let currentUser = user.data;
                    //setting socket user id
                    socket.userId = currentUser.userId
                    let fullName = `${currentUser.firstName} ${currentUser.lastName}`
                    console.log(`${fullName} is online`);
                   // socket.emit(currentUser.userId,'You are online');

                    let userObj = {userId : currentUser.userId, fullName:fullName}
                    allOnlineUsers.push(userObj)
                }
            })
        })//end listening set-ser event

        socket.on('disconnect',()=>{
            //disconnect the user from socket
            //remove the user from online list
            //unsubscribe the user from his own channel

            console.log('user is disconnected');
            //console.log(socket.connectorName);

            console.log(socket.userId);

            var removefIndex = allOnlineUsers.map(function(user) {return user.userId;}).indexOf(socket.userId)
            allOnlineUsers.splice(removeIndex,1)
            console.log(allOnlineUsers)



        })//end of disconnect

        socket.on('chat-msg', (data)=>{
            console.log('socket chat-msg called');
            console.log(data);
            myIo.emit(data.receiverId, data)
        });


    });
}

module.exports = {
    setServer : setServer
}