# TalkJS

The base of the library was written by **Henrik Joreteg**.

Check out the official client: http://talk.pinting.hu

## Build

`npm install`: Install dependencies


`grunt build`: Build the library


`grunt debug`: Search for errors

## Functions

### startLocalMedia(media, cb)

```js
@media {object} Type of the local stream

{
    audio: true,
    video: true
}

@cb {function}
```

Start a local stream with the given media type.

### stopLocalMedia

Stop the local stream.

### pauseVideo

Pause the local video stream.

### resumeVideo

Resume local video stream.

### pause

Pause the local video stream and mute the microphone.

### resume

Resume the local video stream and unmute the microphone.

### mute

Mute the microphone.

### unmute

Unmute the microphone.

### attachMediaStream

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

### createRoom

```js
@user {string} Username
@name {string} Name of new room
@cb {function}

function(error) {}
```

Create a new room if it is not exists and join it, with the given username.

### leaveRoom

```js
@cb {function}

function(room) {
    // room: the name of the left room
}
```

Leave the current room.

### joinRoom

```js
@user {string} Username
@name {string} Name of an existing room
@cb {function}

function(error, clients) {
    // error: null, if everything went fine
    // clients: an assoc list of users
}
```

Join to an existing room, with the given username. 

### registerUser

```js
@user {string} Username
@pass {string} Password
@cb {function}

function(error) {}
```

Register a new user with given parameters. Passwords will be encrypted (with SHA256) twice: locally, and on the server-side.

### loginUser

```js
@user {string} Username
@pass {string} Password
@cb {function}

function(error) {}

@encrypt {boolean} Encrypt the password locally
```

Login a registered user with the given parameters. Local password encryption can be disabled - this can be handy, if we saved the hashed password to localStorage and we want to reuse it.

### logoutUser

Logout the current user.

### friendList

```js
@cb {function}

function(error, online, offline) {
    // error: null, if everything went fine
    // online: an assoc list of users
    // offline: list of usernames
}
```

Get the current friend list.

### addFriend

```js
@name {string}
@cb {function}

function(error) {}
```

Add a registered user to the friend list.

### delFriend

```js
@name {string}
@cb {function}

function(error) {}
```

Remove user from the friend list.

### changeName

```js
@name {string}
```

Change the current username to a new one, in the current room - this will not change the registered username.

### sendPrivateMessage

```js
@name {string}
@message {string}
```

Send a private message to a user with the given username.

### sendRoomMessage

```js
@message {string}
```

Send a message to everybody in the current room.

### muteElement

```js
@peer {object}
```

Mute the audio/video element of a peer

### muteElementForAll

Mute every audio/video element of peers in the current room

### unmuteElement

```js
@peer {object}
```

Unmute the audio/video element of a peer

### unmuteElementForAll

Unmute every audio/video element of peers in the current room

### setElementVolume

```js
@peer {object}
@volume {int}
```

Set a volume for the audio/video element of a peer. The volume needs to be between 100 and 0.

### setElementVolumeForAll

```js
@volume {int}
```

Set a volume for every audio/video element of peers in the current room.

## Server errors

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

Local stream has started.

### peerAdded

```js
function(peer) {}
```

New peer was added.

### peerRemoved

```js
function(peer) {}
```

Peer has left or disconnected.

### nameChanged

```js
function(peer) {}
```

Peer name was changed.

### chat

```js
function(peer, message) {}
```

Chat message was received from a room member.

### pm

```js
function(peer, message) {}
```

Private message was received from a friend.

### speaking

```js
function(peer) {}
```

Peer has started speaking.

### stoppedSpeaking

```js
function(peer) {}
```

Peer has stopped speaking.

### error

```js
function(error) {}
```

Referring to an occurred error.