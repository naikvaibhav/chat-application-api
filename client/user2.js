//create connection with socket
const socket = io('http://localhost:3000');

const authToken = ""
const userId = " "

let chatMessage = {
    createdOn : Date.now(),
    receiverId : ' ',
    receiverName: ' ',
    senderId: userId,
    senderName: ' '
}

let chatSocket = ()=>{
    socket.on('verifyUser',(data)=>{
        console.log("socket tryng to verify user");
        socket.emit("set-user", authToken);

    });

    socket.on(userId, (data)=>{
        console.log("you received a message from"+data.senderName)
        console.log(data.message)
    });

    $('#send').on('click', function() {
        let messageText = $('#messageToSend').val()
        chatMessage.message = messageText;
        socket.emit('chat-msg',chatMessage)
    })
} //end chat socket function