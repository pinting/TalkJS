var attachMediaStream = require("attachmediastream");
var io = require("socket.io-client");
var WebRTC = require("./webrtc");
var Util = require("./util");

/**
 * Main object of the application: child of SimpleWebRTC
 * @options {object}
 */

function Talk(options) {
    WebRTC.call(this, options || {});

    var self = this;
    var peer;

    this.config.server = this.config.server || "http://srv.talk.pinting.hu:8000";
    this.loggedIn = false;
    this.roomName = "";
    this.username = "";
    this.Util = Util;

    this.connection = io.connect(this.config.server, {timeout: 60000});
    this.connection.on("connect", function() {
        self.emit("connectionReady", self.connection.socket.sessionid);
    });
    this.connection.on("remove", function(client) {
        var peer;
        if(client.id !== self.connection.socket.sessionid) {
            peer = self.getRoomPeer(client);
            if(Util.isObject(peer)) {
                peer.end();
            }
        }
        self.logger.log("Server:", "remove", client, peer);
    });
    this.connection.on("online", function(client) {
        peer = self.createFriendPeer({
            username: client.username,
            type: client.type,
            id: client.id
        });
        peer.start(self.username);
        self.emit("friendOnline", peer);
        self.logger.log("Server:", "online", client);
    });
    this.connection.on("offline", function(client) {
        peer = self.getFriendPeer({
            username: client.username,
            type: client.type,
            id: client.id
        });
        if(Util.isObject(peer)) {
            self.emit("friendOffline", peer);
            peer.end();
        }
        self.logger.log("Server:", "offline", client);
    });
    this.connection.on("message", function(type, message) {
        switch(type) {
            case "friend":
                self.handleFriendMessage(message);
                break;
            case "room":
                self.handleRoomMessage(message);
                break;
        }
    });
    this.on("message", function(type, payload) {
        self.connection.emit("message", type, payload);
    });

    if(this.config.debug) {
        this.on("*", function() {
            self.logger.log("Event:", arguments);
        });
    }
}

Util.inherits(Talk, WebRTC);

/**
 * Change the current username
 * @name {string}
 */

Talk.prototype.changeName = function(username) {
    username = Util.safeStr(username);
    if(Util.isString(username)) {
        this.username = username;
        this.sendInRoom("setName", username);
        this.logger.log('Username has changed to "%s"', username);
    }
};

/**
 * Pipe stream into an element
 * @options {object} Options for the element (muted, mirror, autoplay)
 * @element {object} HTML element to pipe in (optional)
 */

Talk.prototype.attachMediaStream = function(options, element) {
    return attachMediaStream(this.localStream, element, options || {
        muted: true,
        mirror: true
    });
};

/**
 * Create a room and join
 * @username {string}
 * @name {string}
 * @cb {function}
 */

Talk.prototype.createRoom = function(username, name, cb) {
    var self = this;

    this.roomName = Util.safeStr(name);
    this.connection.emit("createRoom", {
        type: this.config.media.video ? "video" : this.config.media.audio ? "audio" : "data",
        username: this.loggedIn ? this.username : this.username = Util.safeStr(username),
        name: this.roomName
    }, function(error) {
        if(Util.isNone(error)) {
            self.logger.log('Room "%s" has successfully created', self.roomName);
        }
        else {
            self.logger.warn('Failed to create room "%s", because an "%s" error occurred', self.roomName, error);
        }
        Util.safeCb(cb)(error);
    });
};

/**
 * Leave the current room
 * @cb {function}
 */

Talk.prototype.leaveRoom = function(cb) {
    if(this.roomName) {
        this.connection.emit("leaveRoom");
        this.peers.room.forEach(function(peer) {
            peer.end();
        });
        this.logger.log('Room "%s" has left', this.roomName);
        this.peers.room = [];
        this.roomName = null;
        Util.safeCb(cb)(this.roomName);
    }
    else {
        Util.safeCb(cb)(null);
    }
};

/**
 * Join to an existing room
 * @username {string}
 * @name {string}
 * @cb {function}
 */

Talk.prototype.joinRoom = function(username, name, cb) {
    var peer, client;
    var self = this;
    var room = {
        username: this.loggedIn ? this.username || (this.username = Util.safeStr(username)) : this.username = Util.safeStr(username),
        type: this.config.media.video ? "video" : this.config.media.audio ? "audio" : "data",
        name: Util.safeStr(name)
    };

    this.connection.emit("joinRoom", room, function(error, clients) {
        if(!Util.isNone(error)) {
            self.logger.warn('Failed to join to room "%s", because an "%s" error occurred', room.name, error);
        }
        else {
            for(var id in clients) {
                client = clients[id];
                peer = self.createRoomPeer({
                    username: client.username,
                    type: client.type,
                    id: id
                });
                peer.start(self.username || username);
            }
            self.roomName = room.name;
            self.logger.log('Joined successfully to room "%s"', room.name);
        }
        Util.safeCb(cb)(error, clients);
    });
};
/**
 * Register a new user
 * @username {string}
 * @password {string}
 * @cb {function}
 */

Talk.prototype.registerUser = function(username, password, cb) {
    var self = this;

    this.connection.emit("registerUser", username, Util.sha256(password), function(error) {
        if(!Util.isNone(error)) {
            self.logger.warn('Failed to register as "%s", because an "%s" error occurred', username, error);
        }
        else {
            self.logger.log('Registered successfully as "%s"', username);
        }
        Util.safeCb(cb)(error);
    });
};

/**
 * Login in a registred user
 * @username {string}
 * @password {string}
 * @cb {function}
 * @encrypt {boolean} Encrypt the password locally
 */

Talk.prototype.loginUser = function(username, password, cb, encrypt) {
    var self = this;

    if(Util.isNone(encrypt)) {
        encrypt = true;
    }
    this.connection.emit("loginUser", username, encrypt ? Util.sha256(password) : password, function(error) {
        if(!Util.isNone(error)) {
            self.logger.warn('Failed to login as "%s", because an "%s" error occurred', username, error);
        }
        else {
            self.loggedIn = true;
            self.changeName(username);
            self.logger.log('Logged in successfully as "%s"', username);
        }
        Util.safeCb(cb)(error);
    });
};

/**
 * Logout the logged in user
 */

Talk.prototype.logoutUser = function() {
    this.peers.friend.forEach(function(peer) {
        peer.end();
    });
    this.loggedIn = false;
    this.connection.emit("logoutUser");
    this.logger.log("Logged out successfully");
};

/**
 * Add user to the friend list
 * @name {string}
 * @cb {function}
 */

Talk.prototype.addFriend = function(username, cb) {
    var self = this;

    this.connection.emit("addFriend", username, function(error) {
        if(!Util.isNone(error)) {
            if(error === "notLoggedIn") {
                self.loggedIn = false;
            }
            self.logger.warn('Failed to add "%s", because an "%s" error occurred', username, error);
        }
        else {
            self.logger.log('"%s" added successfully', username);
        }
        Util.safeCb(cb)(error);
    });
};

/**
 * Remove user from the friend list
 * @name {string}
 * @cb {function}
 */

Talk.prototype.delFriend = function(username, cb) {
    var self = this;
    var peer;

    this.connection.emit("delFriend", username, function(error) {
        if(!Util.isNone(error)) {
            if(error === "notLoggedIn") {
                self.loggedIn = false;
            }
            self.logger.warn('Failed to delete "%s", because an "%s" error occurred', username, error);
        }
        else {
            if(Util.isObject(peer = self.getFriendPeer({username: username}))) {
                peer.end();
                self.emit("friendOffline", peer);
            }
            self.logger.log('"%s" deleted successfully', username);
        }
        Util.safeCb(cb)(error);
    });
};

module.exports = Talk;