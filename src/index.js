const express = require('express');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const Filter = require('bad-words');
const { generateMessage, generateLocationMessage } = require('./utils/messages');
const {
    ADMIN_USERNAME,
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
} = require('./utils/users');


const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicDirPath = path.join(__dirname, '../public');


app.use(express.static(publicDirPath));

//Websockets
io.on('connection', (socket) => {
    console.log('New websocket connection established');

    //join a room
    socket.on('join', (joinData, callback) => {

        const { user, error } = addUser({ id: socket.id, ...joinData });
        if (error) {
            return callback(error);
        }

        socket.join(user.room);     //room field in joinData may have been modified (eg trimmed) by addUser

        const welcomeMsg = `Welcome, ${user.username}!`;
        const joinNotification = `${user.username} just joined`;
        socket.emit('serverMessage', generateMessage(ADMIN_USERNAME, welcomeMsg));   //send only to present connection client
        socket.broadcast.to(user.room).emit('serverMessage', generateMessage(ADMIN_USERNAME, joinNotification));   //sends to all except present connection client; "to" limits it to the connection's room

        const roomDataObj = {
            room: user.room,
            users: getUsersInRoom(user.room)
        }
        io.to(user.room).emit('serverRoomData', roomDataObj); //list of users in room
    });


    //receive message from one client and send to all in same room
    socket.on('clientMessage', (msg, callback) => {
        const user = getUser(socket.id);
        if (!user || !user.room || !user.username) {
            return callback('The user or chatroom could not be found');
        }

        const filter = new Filter({ placeHolder: '\uD83C\uDF2E' });
        if (filter.isProfane(msg)) {
            msg = filter.clean(msg);
        }

        io.to(user.room).emit('serverMessage', generateMessage(user.username, msg));
        callback(); //acknowledges reception
    });


    //message to all in room when user sends location
    socket.on('clientSendLocation', (coords, callback) => {
        const user = getUser(socket.id);
        if (!user || !user.room || !user.username) {
            return callback('The user or chatroom could not be found');
        }
        io.to(user.room).emit('serverSendLocation', generateLocationMessage(user.username, coords));
        callback();
    });


    //info message to room when user disconnects
    socket.on('disconnect', () => {
        const user = removeUser(socket.id);
        if (user) {
            const leaveNotification = `${user.username} has left.`;
            io.to(user.room).emit('serverMessage', generateMessage(ADMIN_USERNAME, leaveNotification));

            const roomDataObj = {
                room: user.room,
                users: getUsersInRoom(user.room)
            }
            io.to(user.room).emit('serverRoomData', roomDataObj); //list of users in room
        }
    });
});


server.listen(port, () => {
    console.log('Server running on port ' + port);
});