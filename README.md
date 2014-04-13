# TalkJS

The base of the library was written by **Henrik Joreteg**.

## Example

```js
var talk = new Talk();
var name = talk.Util.randNum().toString();

talk.once("connectionReady", function() {
    talk.createRoom(name, "test", function(error) {
        if(error === "roomExists") {
            talk.joinRoom(name, "test");
        }
    });
});
```

## Build

`npm install`: Install dependencies


`grunt build`: Build the library


`grunt debug`: Search for errors

## Functions

### Talk

```js
@options {object}

{
    peerConnectionConfig: {
        iceServers: [
            {"url": "stun:stun.l.google.com:19302"},
            {"url": "stun:stun1.l.google.com:19302"},
            {"url": "stun:stun2.l.google.com:19302"},
            {"url": "stun:stun3.l.google.com:19302"},
            {"url": "stun:stun4.l.google.com:19302"}
        ]
    },
    peerConnectionContraints: {
        optional: [
            {DtlsSrtpKeyAgreement: true},
            {RtpDataChannels: true}
        ]
    },
    media: {
        audio: false,
        video: false
    },
	server: "http://srv.talk.pinting.hu:8000",
    detectSpeakingEvents: false,
    peerVolumeWhenSpeaking: 50,
    adjustPeerVolume: false,
    autoAdjustMic: false,
    debug: false
}
```

Initialize the library.

### Talk.startLocalMedia(media, cb)

```js
@media {object} Type of the local stream

{
    audio: true,
    video: true
}

@cb {function}
```

Start the local stream with the given media type.

### Talk.stopLocalMedia

Stop the local stream.

### Talk.attachMediaStream

```js
@options {object} Options for the element

{
    muted: true,
    mirror: true,
    autoplay: true
}

@element {object} HTML element
```

Pipe stream into the given element, or create a new one.

### Talk.createRoom

```js
@username {string}
@name {string} Name of the room
@cb {function}

function(error) {}
```

Create a new room if it is not exists and join it, with the given username.

### Talk.leaveRoom

```js
@cb {function}

function(room) {
    // room: the name of the room
}
```

Leave the current room.

### Talk.joinRoom

```js
@username {string}
@name {string} Name of the room
@cb {function}

function(error, clients) {
    // error: null, if everything went fine
    // clients: an assoc list of users
}
```

Join to an existing room, with the given username. 

### Talk.registerUser

```js
@username {string}
@password {string}
@cb {function}

function(error) {}
```

Register a new user with given parameters. Passwords will be encrypted (with SHA256) twice: locally, and on the server-side.

### Talk.loginUser

```js
@username {string}
@password {string}
@cb {function}

function(error) {}

@encrypt {boolean} Encrypt the password locally
```

Login a registered user with the given parameters. Local password encryption can be disabled - this can be handy, if we saved the hashed password to localStorage and we want to reuse it.

### Talk.logoutUser

Logout the current user.

### Talk.getFriends

```js
@cb {function}

function(error, online, offline) {
    // error: null, if everything went fine
    // online: an assoc list of users
    // offline: list of usernames
}
```

Get the current friend list.

### Talk.addFriend

```js
@username {string}
@cb {function}

function(error) {}
```

Add a registered user to the friend list.

### Talk.delFriend

```js
@username {string}
@cb {function}

function(error) {}
```

Remove user from the friend list.

### Talk.changeName

```js
@username {string}
```

Change the current username to a new one, in the current room - this will not change the registered username.

### Talk.getFriendPeer

```js
@args {object} Type of the local stream

{
	username: null,
    type: null,
    id: null
}
```

Get peers by id, type and username.

### Talk.getRoomPeer

```js
@args {object} Type of the local stream

{
    type: null,
    id: null
}
```

Get peers by id and type.

### Talk.sendToFriends

```js
@type {string}
@payload {string}
```

Send a private message to every friends.

### Talk.sendInRoom

```js
@type {string}
@payload {string}
```

Send a message to everyone in the current room.

### Talk.muteRoom

Mute all audio/video elements of peers in the current room.

### Talk.unmuteRoom

Unmute all audio/video elements of peers in the current room.

### Talk.setRoomVolume

```js
@volume {int}
```

Set volume for all audio/video elements of peers in the current room.

### Talk.pauseVideo

Pause the local video stream.

### Talk.resumeVideo

Resume local video stream.

### Talk.pause

Pause the local video stream and mute the microphone.

### Talk.resume

Resume the local video stream and unmute the microphone.

### Talk.mute

Mute the microphone.

### Talk.unmute

Unmute the microphone.

### Peer.mute

Mute the media element of the peer.

### Peer.unmute

Unmute the media element of the peer.

### Peer.setVolume

```js
@volume {int}
```

Set volume for the media element of the peer.

### Peer.createDataChannel

```js
@name {string}
@options {object}

{
    reliable: false,
    preset: true
}
```

Create a data channel for the peer.

### Peer.sendData

```js
@channel {object}
@message {object}
```

Send data thought the given channel.

## Server responses

### exists

Selected username exists - on register, for example.

### notFound

Selected username was not found.

### notLoggedIn

Login needed to access to this method.

### args

The arguments are missing, or invalid.

### roomExists

The room exists - for example, when we try to create a new room.

### typeError

The room type is different from ours.

### error

Internal server error - oops.

## Listeners

### connectionReady

The connection with the server is ready.

### localStream

The local stream has started.

### peerStreamAdded

```js
function(peer) {}
```

A new peer was added.

### peerStreamRemoved

```js
function(peer) {}
```

A peer has left or disconnected.

### nameChanged

```js
function(peer) {}
```

A peer name was changed.

### roomMessage

```js
function(peer, message) {}
```

A chat message was received from a room member.

### friendMessage

```js
function(peer, message) {}
```

A private message was received from a friend.

### speaking

```js
function(peer) {}
```

A peer has started speaking.

### stoppedSpeaking

```js
function(peer) {}
```

A peer has stopped speaking.