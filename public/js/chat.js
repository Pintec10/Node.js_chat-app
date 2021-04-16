const socket = io();


//DOM elements
const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $locationButton = document.querySelector('#send-location-btn');
const $messages = document.querySelector('#messages');
const $sidebar = document.querySelector('#sidebar');

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

//Options: parses username and room from url of the page
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });


const autoscroll = () => {
    //New msg element
    const $newMsg = $messages.lastElementChild;

    //Height of new msg
    const newMsgStyles = getComputedStyle($newMsg);
    const newMsgMargin = parseInt(newMsgStyles.marginBottom);
    const newMsgHeight = $newMsg.offsetHeight + newMsgMargin;

    //Visible height
    const visibleHeight = $messages.offsetHeight;

    //Whole messages container height
    const containerHeight = $messages.scrollHeight;

    //Scrolled distance from top
    const scrollPosition = $messages.scrollTop + visibleHeight;

    //if user was viewing bottom, then autoscroll to bottom 
    if (scrollPosition >= containerHeight - newMsgHeight) {
        $messages.scrollTop = $messages.scrollHeight;
    }


}


//receive message from server
socket.on('serverMessage', ({ username, text, createdAt }) => {
    const msgObject = {
        username,
        text,
        createdAt: moment(createdAt).format('H:mm')
    }
    const htmlContent = Mustache.render(messageTemplate, msgObject);
    $messages.insertAdjacentHTML('beforeend', htmlContent);
    autoscroll();
});

//receive location from server
socket.on('serverSendLocation', ({ username, url, createdAt }) => {
    const msgObject = {
        username,
        url,
        createdAt: moment(createdAt).format('H:mm')
    }
    const htmlContent = Mustache.render(locationTemplate, msgObject);
    $messages.insertAdjacentHTML('beforeend', htmlContent);
    autoscroll();
});

//receive room data from server
socket.on('serverRoomData', roomDataObj => {
    const htmlContent = Mustache.render(sidebarTemplate, roomDataObj);
    $sidebar.innerHTML = htmlContent;
})


//send message to server
const sendMessageCallback = (error) => {
    $messageFormButton.removeAttribute('disabled');
    $messageFormInput.value = '';
    $messageFormInput.focus();
    if (error) {
        return alert(error);
    }
    console.log('Message delivered successfully');
};

$messageForm.addEventListener('submit', e => {
    e.preventDefault();
    $messageFormButton.setAttribute('disabled', 'disabled');
    const msg = e.target.elements['message-input'].value;
    socket.emit('clientMessage', msg, sendMessageCallback);
});


//send own location to server
const sendLocationCallback = (error) => {
    $locationButton.removeAttribute('disabled');
    if (error) {
        return alert(error);
    }
    console.log('Location shared successfully');
};

$locationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Sorry, your browser does not support geolocation');
    }
    $locationButton.setAttribute('disabled', 'disabled');
    navigator.geolocation.getCurrentPosition(({ coords }) => {
        const { latitude, longitude } = coords;
        socket.emit('clientSendLocation', { latitude, longitude }, sendLocationCallback);
    });
});


//try to join room as soon as reaching the page
const joinCallback = error => {
    alert(error);
    location.href = '/';
};

socket.emit('join', { username, room }, joinCallback);