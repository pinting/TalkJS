# TalkJS

Check out the official client: http://talk.pinting.hu

The base of the library is written by Henrik Joreteg, and I updated it with a bunch of fixes and features. Still, there is a lot of things left to do. This is just the client side library, and it can only communicate with the official server.

## Functions

### startStream(media, cb)

```js
@media {object} Type of the local stream
@cb {function}
```

Start local stream with the given media type, which needs to be like this:

```js
{
    audio: true,
    video: true
}
```

### stopStream

Stop local stream.

### pipeStream

```js
@options {object} Options for the element
@element {object} HTML element
```

Pipe stream into the given element, or create a new one. The possible options are:

```js
{
    muted: true,
    mirror: true,
    autoplay: true
}
```

### createRoom

```js
@user {string} Username
@name {string} Name of new room
@cb {function}
```

Create a new room, if it is not exists and join it, with the given username. The argument for the callback function needs to be like this:

```js
function(error) {}
```

### leaveRoom

```js
@cb {function}
```

Leave the current room. The argument for the callback function needs to be like this:

```js
function(room) {
    // room: the name of the left room
}
```

### joinRoom

```js
@user {string} Username
@name {string} Name of the existing room
@cb {function}
```

Join to an existing room, with the given username. The arguments for the callback function:

```js
function(error, clients) {
    // error: null, if everything went fine
    // clients: an assoc list of users
}
```

### registerUser

```js
@user {string} Username
@pass {string} Password
@cb {function}
```

Register a new user with given parameters. Passwords will be encrypted (with SHA256) twice: locally, and on the server-side. The argument for the callback function:

```js
function(error) {}
```

### loginUser

```js
@user {string} Username
@pass {string} Password
@cb {function}
@encrypt {boolean} Encrypt the password locally
```

Login a registered user with the given parameters. Local password encryption can be disabled - for example: if we saved the hashed password to localStorage and we want to reuse it, this can be handy. The argument for the callback is the same as in registerUser.

### logoutUser

Logout the current user.

### friendList

```js
@cb {function}
```

Get the current logged in user friend list. The arguments for the callback function:

```js
function(error, online, offline) {
    // error: null, if everything went fine
    // online: an assoc list of users
    // offline: list of usernames
}
```

### addFriend

```js
@name {string}
@cb {function}
```

Add a registered user to the current user friend list.

### delFriend

```js
@name {string}
@cb {function}
```

Remove user from the friend list

### changeName

```js
@name {string}
```

Change the current username to a new one, in the current room - it will not take effect in a registered username.

### sendPrivateMessage

```js
@name {string}
@message {string}
```

Send a private message to a user with given username.

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

Mute all audio/video element of peers in the current room

### unmuteElement

```js
@peer {object}
```

Unmute the audio/video element of a peer.

### unmuteElementForAll

Unmute all audio/video element of peers in the current room

### setElementVolume

```js
@peer {object}
@volume {int}
```

Set the volume for the audio/video element of a peer. The volume needs to be between 100 and 0.

### setElementVolumeForAll

```js
@volume {int}
```

Set the volume for all audio/video element of peers in the current room.

## Errors

### exists

Selected username exists - on register, for example.

### notFound

Selected username not found.

### notLoggedIn

Login needed, to access to this method.

### args

The arguments are missing, or invalid.

### roomExists

The room exists - for example, when try to create a new room.

### typeError

The room type is different from ours.

### error

Internal server error.

## Listeners

### readyToCall

The library is initialized and ready to use.

### peerAdded

A new peer was added. It takes this argument:

```js
function(peer) {}
```

### peerRemoved

A peer left or disconnected. It takes the same argument as peerAdded.

### nameChanged

A peer name was changed. The argument is the same, as in peerAdded.

### chatMessageReceived

Chat message was received from a room member. It takes two arguments like this:

```js
function(peer, message) {}
```

### privateMessageReceived

Private message was received from a friend. It takes the same arguments as chatMessageReceived.

### speaking

A peer started speaking. Same argument as peerAdded.

### stoppedSpeaking

A peer stopped speaking. Argument is the same as in peerAdded.