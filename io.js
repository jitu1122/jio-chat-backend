const server = require("./server");
const io = require('socket.io')(server);
const chatUsers = require('./model/chatUsers');
const getUserFromToken = require('./auth');


io.on('connection', socket => {
    //Get the chatID of the user and join in a room of the same chatID
    console.log("new connnn");
    var userId = getUserFromToken(socket.handshake.query.token);
    socket.join(userId);
    chatUsers.data[userId].online = true;

    //Leave the room if the user closes the socket
    socket.on('disconnect', () => {
        chatUsers.data[userId].online = false;
        socket.leave(userId, ()=>{})
    });

    socket.on('set_available', id => {
        if (chatUsers.data.hasOwnProperty(id)) {
            chatUsers.data[id].online = true;
        }
        console.log(chatUsers);
    });

    socket.on('available_users', () => {
        io.emit(chatUsers.data);
    });

    //Leave the room if the user closes the socket
    socket.on('users', () => {
        socket.leave(userId, ()=>{})
    });

    //Send message to only a particular user
    socket.on('send_message', message => {
        receiverChatID = message.receiverChatID;
        senderChatID = message.senderChatID;
        content = message.content;

        //Send message to only that particular room
        socket.in(receiverChatID).emit('receive_message', {
            'content': content,
            'senderChatID': senderChatID,
            'receiverChatID': receiverChatID,
        })
    })
});

module.exports = io;
