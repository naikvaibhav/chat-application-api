//create connection with socket
const socket = io('http://localhost:3000');

const authToken = ""
const userId = " "

let chatMessage = {
    createdOn : Date.now(),
    receiverId : ' ',
    receiverName: ' ',
    senderId: ' ',
    senderName: ' '
}

let chatSocket = ()=>{
    socket.on('verifyUser',(data)=>{
        console.log("socket tryng to verify user");
        socket.emit("set-user", authToken);

    });

    socket.on(userId, (data)=>{
        console.log("you received a message")
        console.log(data)
    });
} //end chat socket function