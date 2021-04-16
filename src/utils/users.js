const users = [];
const ADMIN_USERNAME = 'Chatbot';

const addUser = ({ id, username, room }) => {
    //clean and validate data
    username = username.trim();
    room = room.trim().toLowerCase();
    if (!username || !room) {
        return {
            error: 'username and room are required'
        }
    }

    //check for already existing username in same room
    const existingUser = users.find(user => {
        return (
            user.username.toLowerCase() === username.toLowerCase()
            && user.room === room)
    });
    if (existingUser || username.toLowerCase() === ADMIN_USERNAME.toLowerCase()) {
        return {
            error: 'username already in use'
        }
    }

    //store & return user
    const user = { id, username, room };
    users.push(user);
    return { user };
};


const removeUser = id => {
    const index = users.findIndex(user => user.id === id);
    if (index !== -1) {
        return users.splice(index, 1)[0];
    }
}


const getUser = id => {
    const matchingUser = users.find(user => user.id === id);
    return matchingUser;
}


const getUsersInRoom = room => {
    room = room.trim().toLowerCase();
    const roomUsers = users.filter(user => user.room === room);
    return roomUsers;
}




module.exports = {
    ADMIN_USERNAME,
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
}