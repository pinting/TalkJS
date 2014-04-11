var attachMediaStream = require("attachmediastream");
var io = require("socket.io-client");
var WebRTC = require("./webrtc");

/**
 * Main object of the application: child of SimpleWebRTC
 * @options {object}
 */

function Talk(options) {
    WebRTC.call(this, options || {});

    var self = this;

    this.config.server = this.config.server || "http://srv.talk.pinting.hu:8000";
    this.loggedIn = false;
    this.roomName = "";
    this.username = "";

    this.connection = io.connect(this.config.server);
    this.connection.on("connect", function() {
        self.emit("connectionReady", self.connection.socket.sessionid);
    });
    this.connection.on("remove", function(peer) {
        if(peer.id !== self.connection.socket.sessionid) {
            self.removePeers(peer.id, peer.type);
        }
    });
    this.connection.on("message", function(type, message) {
        switch(type) {
            case "room":
                self.handleRoomMessage(message);
                break;
            case "friend":
                self.handleFriendMessage(message);
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

inherits(Talk, WebRTC);

/**
 * Change the current username
 * @name {string}
 */

Talk.prototype.changeName = function(name) {
    if(name = safeStr(name)) {
        this.username = name;
        this.sendToAll("setName", name);
        this.logger.log("Name has changed:", name);
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
    this.roomName = safeStr(name);
    this.connection.emit("createRoom", {
        type: this.config.media.video ? "video" : this.config.media.audio ? "audio" : "data",
        username: this.loggedIn ? this.username : this.username = safeStr(username),
        name: this.roomName
    }, function(error) {
        if(isNone(error)) {
            self.logger.log("Room has successfully created:", self.roomName);
        }
        else {
            self.logger.warn("Failed to create the room:", self.roomName, error);
        }
        safeCb(cb)(error);
    });
};

/**
 * Leave the current room
 * @cb {function}
 */

Talk.prototype.leaveRoom = function(cb) {
    if(this.roomName) {
        this.connection.emit("leave");
        this.peers.room.forEach(function(peer) {
            peer.end();
        });
        this.logger.log("Room has left", this.roomName);
        this.peers.room = [];
        this.roomName = null;
        safeCb(cb)(this.roomName);
    }
    else {
        safeCb(cb)(null);
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
        username: this.loggedIn ? this.username || (this.username = safeStr(username)) : this.username = safeStr(username),
        type: this.config.media.video ? "video" : this.config.media.audio ? "audio" : "data",
        name: safeStr(name)
    };

    this.connection.emit("joinRoom", room, function(error, clients) {
        if(!isNone(error)) {
            self.logger.warn("Failed to join to the room:", room.name, error);
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
                self.peers.room.push(peer);
            }
            self.roomName = room.name;
            self.logger.log("Joined successfully to the room:", room.name);
        }
        safeCb(cb)(error, clients);
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
    this.connection.emit("registerUser", username, sha256(password), function(error) {
        if(!isNone(error)) {
            self.logger.warn("Failed to register:", username, error);
        }
        else {
            self.logger.log("Registered successfully:", username);
        }
        safeCb(cb)(error);
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
    if(isNone(encrypt)) {
        encrypt = true;
    }
    this.connection.emit("loginUser", username, encrypt ? sha256(password) : password, function(error) {
        if(!isNone(error)) {
            self.logger.warn("Failed to login:", username, error);
        }
        else {
            self.loggedIn = true;
            self.changeName(username);
            self.logger.log("Logged in successfully:", username);
        }
        safeCb(cb)(error);
    });
};

/**
 * Logout the logged in user
 */

Talk.prototype.logoutUser = function() {
    this.peers.friend.forEach(function(peer) {
        peer.pc.close();
    });
    this.logger.log("Logged out successfully");
    this.connection.emit("logoutUser");
    this.peers.friend = [];
    this.loggedIn = false;
};

/**
 * Get the current friend list
 * @cb {function}
 */

Talk.prototype.getFriends = function(cb) {
    var client, peer;
    var friends = [];
    var self = this;

    this.connection.emit("getFriends", function(error, online, offline) {
        if(!isNone(error)) {
            if(error === "notLoggedIn") {
                self.loggedIn = false;
            }
            self.logger.warn("Failed to get the friends list:", error);
        }
        for(var id in online) {
            if(!self.peers.friend.filter(function(peer) {
                if(peer.id === id) {
                    friends.push(peer);
                    return true;
                }
                return false;
            }).length) {
                client = online[id];
                peer = self.createFriendPeer({
                    username: client.username,
                    type: "data",
                    id: id
                });
                peer.start(self.username);
                friends.push(peer);
            }
        }
        self.peers.friend.forEach(function(peer) {
            if(!find(friends, peer)) {
                peer.pc.close();
            }
        });
        self.peers.friend = friends;
        safeCb(cb)(error, online, offline);
    });
};

/**
 * Add user to the friend list
 * @name {string}
 * @cb {function}
 */

Talk.prototype.addFriend = function(username, cb) {
    var self = this;
    this.connection.emit("addFriend", username, function(error) {
        if(!isNone(error)) {
            if(error === "notLoggedIn") {
                self.loggedIn = false;
            }
            self.logger.warn("Failed to add a friend:", username, error);
        }
        else {
            self.logger.log("Friend added successfully");
        }
        safeCb(cb)(error);
    });
};

/**
 * Remove user from the friend list
 * @name {string}
 * @cb {function}
 */

Talk.prototype.delFriend = function(username, cb) {
    var self = this;
    this.connection.emit("delFriend", username, function(error) {
        if(!isNone(error)) {
            if(error === "notLoggedIn") {
                self.loggedIn = false;
            }
            self.logger.warn("Failed to delete a friend:", username, error);
        }
        else {
            self.logger.log("Friend deleted successfully");
        }
        safeCb(cb)(error);
    });
};

module.exports = Talk;