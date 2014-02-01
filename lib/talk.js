var attachMediaStream = require("attachmediastream");
var WildEmitter = require("wildemitter");
var mockconsole = require("mockconsole");
var io = require("socket.io-client");
var WebRTC = require("./webrtc");
var Peer = require("./peer");

/**
 * Main object of the application: child of SimpleWebRTC
 * @options {object}
 */

function Talk(options) {
    WildEmitter.call(this);

    var self = this;
    var volumes = {};
    var messages = [];
    var item, connection;
    var config = this.config = {
        server: "http://talk.pinting.hu:8000",
        peerConnectionContraints: {
            optional: [
                {DtlsSrtpKeyAgreement: true},
                {RtpDataChannels: false}
            ]
        },
        peerVolumeWhenSpeaking: 50,
        detectSpeakingEvents: true,
        enableDataChannels: false,
        adjustPeerVolume: false,
        autoAdjustMic: false,
        debug: false
    };

    for(item in (options = options || {})) {
        this.config[item] = options[item];
    }

    this.connection = io.connect(this.config.server);
    this.loggedIn = false;
    this.stream = null;
    this.friends = [];
    this.room = "";
    this.user = "";
    this.logger = function() {
        if(self.config.debug) {
            return self.config.logger || console;
        }
        else {
            return self.config.logger || mockconsole;
        }
    }();
    this.connection.on("connect", function() {
        self.emit("connectionReady", self.connection.socket.sessionid);
        self.sessionReady = true;
        self.checkIfReady();
    });
    this.connection.on("message", function(message) {
        var peers = self.webrtc.getPeers(message.from, message.roomType);
        var friends = self.friends.filter(function(peer) {
            return peer.id === message.from;
        });
        var peer = peers[0];
        var friend = friends[0];

        switch(message.type) {
            case "offer":
                if(!peers.length) {
                    peer = self.webrtc.createPeer({
                        type: message.roomType,
                        user: message.user,
                        id: message.from
                    });
                    self.webrtc.peers.push(peer);
                }
                peer.handleMessage(message);
                break;
            case "chat":
                self.emit("chatMessageReceived", peer, safeText(message.payload));
                break;
            case "set_name":
                peer.user = safeStr(message.payload) || "";
                self.emit("nameChanged", peer);
                break;
            case "speaking":
                self.emit("speaking", peer);
                break;
            case "stopped_speaking":
                self.emit("stoppedSpeaking", peer);
                break;
            case "friend":
                if(!friends.length) {
                    friend = new Peer({
                        parent: self.webrtc,
                        user: message.user,
                        id: message.from,
                        type: "text"
                    });
                    self.friends.push(friend);
                }
                friend.handleMessage(message);
                break;
            case "pm":
                self.emit("privateMessageReceived", friend, safeText(message.payload));
                break;
            default:
                if(peers.length) {
                    peers.forEach(function(peer) {
                        peer.handleMessage(message);
                    });
                }
                if(friends.length) {
                    friends.forEach(function(friend) {
                        friend.handleMessage(message);
                    });
                }
                break;
        }
    });
    this.connection.on("remove", function(peer) {
        if(peer.id !== self.connection.socket.sessionid) {
            self.webrtc.removePeers(peer.id, peer.type);
        }
    });

    options.logger = this.logger;
    options.debug = false;

    this.webrtc = new WebRTC(this.config);
    this.webrtc.on("*", function() {
        self.emit.apply(self, arguments);
    });
    this.webrtc.on("localStream", function() {
        self.checkIfReady();
    });
    this.webrtc.on("message", function(payload) {
        self.connection.emit("message", payload);
    });
    this.webrtc.on("peerStreamAdded", this.handlePeerStreamAdded.bind(this));
    this.webrtc.on("peerStreamRemoved", this.handlePeerStreamRemoved.bind(this));

    if(this.config.adjustPeerVolume) {
        this.webrtc.on("localSpeaking", function() {
            self.webrtc.peers.forEach(function(peer) {
                if(isNone(volumes[peer.id])) {
                    if(self.config.peerVolumeWhenSpeaking < peer.element.volume * 100) {
                        volumes[peer.id] = peer.element.volume * 100;
                        self.setElementVolume(peer, self.config.peerVolumeWhenSpeaking);
                    }
                }
            });
        });
        this.webrtc.on("localStoppedSpeaking", function() {
            self.webrtc.peers.forEach(function(peer) {
                if(isNumber(volumes[peer.id])) {
                    if(self.config.peerVolumeWhenSpeaking == peer.element.volume * 100) {
                        self.setElementVolume(peer, volumes[peer.id]);
                    }
                    delete volumes[peer.id];
                }
            });
        });
    }

    if(config.debug) {
        this.on("*", this.logger.log.bind(this.logger));
    }

    ["mute", "unmute", "pause", "resume"].forEach(function(method) {
        self[method] = self.webrtc[method].bind(self.webrtc);
    });
}

Talk.prototype = Object.create(WildEmitter.prototype, {
    constructor: {
        value: Talk
    }
});

/**
 * Start local stream
 * @media {object} Type of the local stream
 * @cb {function}
 */

Talk.prototype.startStream = function(media, cb) {
    var self = this;
    if(!isObject(media) || !isBool(media.audio) || !isBool(media.video)) {
        media = {audio: true, video: true};
    }
    this.config.media = this.webrtc.config.media = media;
    this.webrtc.startLocalMedia(media, function(error, stream) {
        if(error) {
            self.emit("error", error);
        }
        self.stream = stream;
        safeCb(cb)(error, stream);
    });
};

/**
 * This function is a workaround for the strange no-audio bug
 */

Talk.prototype.checkIfReady = function() {
    var self = this;
    if(this.webrtc.localStream && this.sessionReady) {
        setTimeout(function() {
            self.emit("readyToCall", self.connection.socket.sessionid);
        }, RTCDetectedPrefix === "webkit" ? 1000 : 0);
    }
};

/**
 * Stop local stream
 */

Talk.prototype.stopStream = function() {
    this.webrtc.stopLocalMedia();
    this.stream = null;
};

/**
 * Pipe stream into an element
 * @options {object} Options for the element (muted, mirror, autoplay)
 * @element {object} HTML element to pipe in (optional)
 */

Talk.prototype.pipeStream = function(options, element) {
    return attachMediaStream(this.stream, element, options || {
        muted: true,
        mirror: true
    });
};

/**
 * Create a room and join
 * @user {string}
 * @name {string}
 * @cb {function}
 */

Talk.prototype.createRoom = function(user, name, cb) {
    this.room = safeStr(name);
    this.connection.emit("create", {
        user: this.loggedIn ? this.user : this.user = safeStr(user),
        name: this.room,
        type: this.config.media.video ? "video" : "audio"
    }, safeCb(cb));
};

/**
 * Leave the current room
 * @cb {function}
 */

Talk.prototype.leaveRoom = function(cb) {
    if(this.room) {
        this.connection.emit("leave");
        this.webrtc.peers.forEach(function(peer) {
            peer.end();
        });
        safeCb(cb)(this.room);
        this.emit("leftRoom", this.room);
        this.webrtc.peers = [];
        this.room = null;
    }
};

/**
 * Join to an existing
 * @user {string}
 * @name {string}
 * @cb {function}
 */

Talk.prototype.joinRoom = function(user, name, cb) {
    var id, peer, client;
    var self = this;
    var room = {
        user: this.loggedIn ? this.user || (this.user = safeStr(user)) : this.user = safeStr(user),
        name: safeStr(name),
        type: this.config.media.video ? "video" : "audio"
    };

    this.connection.emit("join", room, function(error, clients) {
        if(error) {
            self.emit("error", error);
        }
        else {
            for(id in clients) {
                client = clients[id];
                peer = self.webrtc.createPeer({
                    type: client.type === "audio" ? "audio" : "video",
                    user: client.user,
                    id: id
                });
                peer.start("offer", self.user || user);
                self.webrtc.peers.push(peer);
            }
            self.room = room.name;
            self.emit("joinedRoom", room.name);
        }
        safeCb(cb)(error, clients);
    });
};
/**
 * Register a new user
 * @user {string}
 * @name {string}
 * @cb {function}
 */

Talk.prototype.registerUser = function(name, pass, cb) {
    var self = this;
    this.connection.emit("register", name, sha256(pass), function(error) {
        if(error) {
            self.emit("error", error);
        }
        safeCb(cb)(error);
    });
};

/**
 * Register a new user
 * @user {string}
 * @name {string}
 * @cb {function}
 * @encrypt {boolean} Encrypt the password locally
 */

Talk.prototype.loginUser = function(name, pass, cb, encrypt) {
    var self = this;
    if(isNone(encrypt)) {
        encrypt = true;
    }
    this.connection.emit("login", name, encrypt ? sha256(pass) : pass, function(error) {
        if(error) {
            self.emit("error", error);
        }
        else {
            self.loggedIn = true;
            self.changeName(name);
        }
        safeCb(cb)(error);
    });
};

/**
 * Logout the logged in user
 */

Talk.prototype.logoutUser = function() {
    this.friends.forEach(function(peer) {
        peer.pc.close();
    });
    this.connection.emit("logout");
    this.loggedIn = false;
    this.friends = [];
};

/**
 * Get the current friend list
 * @cb {function}
 */

Talk.prototype.friendList = function(cb) {
    var id, client, peer;
    var friends = [];
    var self = this;

    this.connection.emit("friends", function(error, online, offline) {
        if(error) {
            if(error === "notLoggedIn") {
                self.loggedIn = false;
            }
            self.emit("error", error);
        }
        for(id in online) {
            if(!self.friends.filter(function(peer) {
                if(peer.id === id) {
                    friends.push(peer);
                    return true;
                }
                return false;
            }).length) {
                client = online[id];
                peer =  new Peer({
                    parent: self.webrtc,
                    user: client.user,
                    type: "text",
                    id: id
                });
                peer.start("friend", self.user);
                friends.push(peer);
            }
        }
        self.friends.forEach(function(peer) {
            if(friends.indexOf(peer) < 0) {
                peer.pc.close();
            }
        });
        self.friends = friends;
        safeCb(cb)(error, online, offline);
    });
};

/**
 * Add user to the friend list
 * @name {string}
 * @cb {function}
 */

Talk.prototype.addFriend = function(name, cb) {
    var self = this;
    this.connection.emit("add", name, function(error) {
        if(error) {
            if(error === "notLoggedIn") {
                self.loggedIn = false;
            }
            self.emit("error", error);
        }
        safeCb(cb)(error);
    });
};

/**
 * Remove user from the friend list
 * @name {string}
 * @cb {function}
 */

Talk.prototype.delFriend = function(name, cb) {
    var self = this;
    this.connection.emit("del", name, function(error) {
        if(error) {
            if(error === "notLoggedIn") {
                self.loggedIn = false;
            }
            self.emit("error", error);
        }
        safeCb(cb)(error);
    });
};

/**
 * Change the current username
 * @name {string}
 */

Talk.prototype.changeName = function(name) {
    if(name = safeStr(name)) {
        this.webrtc.sendToAll("set_name", name);
        this.user = name;
    }
};


/**
 * Send a private message to a user
 * @name {string}
 * @message {string}
 */

Talk.prototype.sendPrivateMessage = function(name, message) {
    this.friends.forEach(function(peer) {
        if(peer.user === name) {
            peer.send("pm", message);
        }
    });
};

/**
 * Handle when peer added
 * @peer {object}
 */

Talk.prototype.handlePeerStreamAdded = function(peer) {
    if(peer.type === "text") {
        // Dirty fix for Firefox empty video cointainer issues
        return;
    }

    var element = attachMediaStream(peer.stream, document.createElement(peer.type === "audio" ? "audio" : "video"));
    var container = document.createElement("div");

    element.id = [peer.id, peer.type, peer.broadcaster ? "broadcasting" : "incoming"].join("_");
    peer.element = element;

    container.id = [element.id, "container"].join("_");
    container.className = (peer.broadcaster ? "broadcasting" : "incoming");
    container.appendChild(element);

    document.body.appendChild(container);
    peer.container = container;

    this.emit("peerAdded", peer);
};

/**
 * Handle when peer removed
 * @peer {object}
 */

Talk.prototype.handlePeerStreamRemoved = function(peer) {
    if(peer.container) {
        document.body.removeChild(peer.container);
        this.emit("peerRemoved", peer);
    }
};

/**
 * Send a message to the peers in the current room
 * @message {string}
 */

Talk.prototype.sendRoomMessage = function(message) {
    this.webrtc.sendToAll("chat", message);
};

/**
 * Mute the audio/video element of a peer
 * @peer {object}
 */

Talk.prototype.muteElement = function(peer) {
    if(peer.element) {
        peer.element.muted = true;
    }
};

/**
 * Mute all audio/video element of peers in the current room
 */

Talk.prototype.muteElementForAll = function() {
    var self = this;
    this.webrtc.peers.forEach(function(peer) {
        self.muteElement(peer);
    });
};

/**
 * Unmute the audio/video element of a peer
 * @peer {object}
 */

Talk.prototype.unmuteElement = function(peer) {
    if(peer.element) {
        peer.element.muted = false;
    }
};

/**
 * Unmute all audio/video element of peers in the current room
 */

Talk.prototype.unmuteElementForAll = function() {
    var self = this;
    this.webrtc.peers.forEach(function(peer) {
        self.unmuteElement(peer);
    });
};

/**
 * Set volume for the audio/video element of a peer
 * @peer {object}
 * @volume {int}
 */

Talk.prototype.setElementVolume = function(peer, volume) {
    if(peer.element) {
        peer.element.volume = volume / 100;
    }
};

/**
 * Set volume for all audio/video element of peers in the current room
 * @volume {int}
 */

Talk.prototype.setElementVolumeForAll = function(volume) {
    var self = this;
    this.webrtc.peers.forEach(function(peer) {
        self.setElementVolume(peer, volume);
    });
};

module.exports = Talk;