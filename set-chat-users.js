const User = require("./model/user");
const chatUsers = require("./model/chatUsers");
const io = require('./io');


const SetChatUsers = async () => {
    let users = await User.find({});
    chatUsers.data = {};
    users.map((r) => {
        if (!chatUsers.data.hasOwnProperty(r.id)) {
            chatUsers.data[r.id] = {name: r.fullname, online: false}
        }
    });
    try {
        io.emit('user_reset');
    } catch (e) {
        
    }
};

module.exports = SetChatUsers;
