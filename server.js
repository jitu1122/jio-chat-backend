const express = require("express");
const bodyParser = require("body-parser");
const InitiateMongoServer = require("./db");
const user = require("./routes/user"); //new addition
var cors = require('cors');
const SetChatUsers = require("./set-chat-users");

// Initiate Mongo Server

const app = express();

// PORT
const PORT = process.env.PORT || 4000;

app.use(bodyParser.json());
app.use(cors());


app.get("/", (req, res) => {
    res.json({message: "All set!!!!!"});
});
app.use("/user", user);
var http = require('http').createServer(app);
var io = require('socket.io')(http);
const chatUsers = require('./model/chatUsers');
const getUserFromToken = require('./auth');
InitiateMongoServer().then(
    ()=> {

        io.on('connection', socket => {
            //Get the chatID of the user and join in a room of the same chatID
            console.log("new connnn");
            var userId = getUserFromToken(socket.handshake.query.token);
            socket.join(userId);
            try {
                chatUsers.data[userId].online = true;
            } catch (e) {
                SetChatUsers();
            }

            //Leave the room if the user closes the socket
            socket.on('disconnect', () => {
                console.log('disconnected');
                try {
                    chatUsers.data[userId].online = false;
                    io.emit('chat-users', chatUsers.data);
                } catch (e) {
                    
                }
                socket.leave(userId, ()=>{})
            });

            socket.on('set_available', id => {
                if (chatUsers.data.hasOwnProperty(id)) {
                    chatUsers.data[id].online = true;
                }
            });

            socket.on('available_users', () => {
                io.emit('chat-users', chatUsers.data);
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
        http.listen(PORT, (req, res) => {
            console.log(`Server Started at PORT ${PORT}`);
        });
    }
);

module.exports = http;
