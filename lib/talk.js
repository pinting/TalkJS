var attachMediaStream = require("attachmediastream");
var WildEmitter = require("wildemitter");
var mockconsole = require("mockconsole");
var io = require("socket.io-client");
var WebRTC = require("./webrtc");
var RTC = require("./adapter");

/**
 * Main object of the application: child of SimpleWebRTC
 * @options {object}
 */

function Talk(options) {
    WildEmitter.call(this);

    this.config = {
        server: "http://srv.talk.pinting.hu:8000",
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
        detectSpeakingEvents: false,
        peerVolumeWhenSpeaking: 50,
        enableDataChannels: true,
        adjustPeerVolume: false,
        autoAdjustMic: false,
        debug: true
    };
    var volumes = {};
    var self = this;
    var item;

    for(item in options || {}) {
        if(!isNone(options[item])) {
            this.config[item] = options[item];
        }
    }

    this.logger = function() {
        if(self.config.debug) {
            return self.config.logger || console;
        }
        else {
            return self.config.logger || mockconsole;
        }
    }();
    this.loggedIn = false;
    this.roomName = "";
    this.userName = "";

    // Server layer

    this.connection = io.connect(this.config.server);
    this.connection.on("connect", function() {
        self.emit("connectionReady", self.connection.socket.sessionid);
    });
    this.connection.on("message", function(message) {
        self.webrtc.handleMessage(message);
    });
    this.connection.on("remove", function(peer) {
        if(peer.id !== self.connection.socket.sessionid) {
            self.webrtc.removePeers(peer.id, peer.type);
        }
    });

    // WebRTC layer

    this.webrtc = new WebRTC(this.config);
    this.webrtc.on("*", function() {
        self.emit.apply(self, arguments);
    });
    this.webrtc.on("message", function(payload) {
        self.connection.emit("message", payload);
    });
    this.webrtc.on("channelMessage", function(message, peer) {
        self.webrtc.handleMessage(message, peer);
    });

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

    if(this.config.debug) {
        this.on("*", function() {
            self.logger.log("Event:", arguments);
        });
    }

    // Use function from the underlying libraries

    [
        "stopLocalMedia",
        "resumeVideo",
        "pauseVideo",
        "resume",
        "unmute",
        "pause",
        "mute"
    ].forEach(function(method) {
        self[method] = self.webrtc[method].bind(self.webrtc);
    });
}

inherits(Talk, WildEmitter);

/**
 * Start local media
 * @media {object} Type of the local stream
 * @cb {function}
 */

Talk.prototype.startLocalMedia = function(media, cb) {
    var self = this;
    if(!isObject(media) || !isBool(media.audio) || !isBool(media.video)) {
        media = {audio: true, video: true};
    }
    this.config.media = this.webrtc.config.media = media;
    this.webrtc.startLocalMedia(media, function(error, stream) {
        if(error) {
            self.emit("error", error);
        }
        safeCb(cb)(error, stream);
    });
};

/**
 * Pipe stream into an element
 * @options {object} Options for the element (muted, mirror, autoplay)
 * @element {object} HTML element to pipe in (optional)
 */

Talk.prototype.attachMediaStream = function(options, element) {
    return attachMediaStream(this.webrtc.localStream, element, options || {
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
    this.roomName = safeStr(name);
    this.connection.emit("create", {
        user: this.loggedIn ? this.userName : this.userName = safeStr(user),
        name: this.roomName,
        type: this.config.media.video ? "video" : this.config.media.audio ? "audio" : "data"
    }, safeCb(cb));
};

/**
 * Leave the current room
 * @cb {function}
 */

Talk.prototype.leaveRoom = function(cb) {
    if(this.roomName) {
        this.connection.emit("leave");
        this.webrtc.peers.forEach(function(peer) {
            peer.end();
        });
        safeCb(cb)(this.roomName);
        this.emit("leftRoom", this.roomName);
        this.webrtc.peers = [];
        this.roomName = null;
    }
};

/**
 * Join to an existing room
 * @user {string}
 * @name {string}
 * @cb {function}
 */

Talk.prototype.joinRoom = function(user, name, cb) {
    var peer, client;
    var self = this;
    var room = {
        user: this.loggedIn ? this.userName || (this.userName = safeStr(user)) : this.userName = safeStr(user),
        type: this.config.media.video ? "video" : this.config.media.audio ? "audio" : "data",
        name: safeStr(name)
    };

    this.connection.emit("join", room, function(error, clients) {
        if(error) {
            self.emit("error", error);
        }
        else {
            for(var id in clients) {
                client = clients[id];
                peer = self.webrtc.createPeer({
                    type: client.type,
                    user: client.user,
                    id: id
                });
                peer.start("offer", self.userName || user);
                self.webrtc.peers.push(peer);
            }
            self.roomName = room.name;
            self.emit("joinedRoom", room.name);
        }
        safeCb(cb)(error, clients);
    });
};
/**
 * Register a new user
 * @user {string}
 * @pass {string}
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
 * Login in a registred user
 * @user {string}
 * @pass {string}
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
    this.webrtc.friends.forEach(function(peer) {
        peer.pc.close();
    });
    this.connection.emit("logout");
    this.webrtc.friends = [];
    this.loggedIn = false;
};

/**
 * Get the current friend list
 * @cb {function}
 */

Talk.prototype.friendList = function(cb) {
    var client, peer;
    var friends = [];
    var self = this;

    this.connection.emit("friends", function(error, online, offline) {
        if(error) {
            if(error === "notLoggedIn") {
                self.loggedIn = false;
            }
            self.emit("error", error);
        }
        for(var id in online) {
            if(!self.webrtc.friends.filter(function(peer) {
                if(peer.id === id) {
                    friends.push(peer);
                    return true;
                }
                return false;
            }).length) {
                client = online[id];
                peer = self.webrtc.createPeer({
                    user: client.user,
                    type: "data",
                    id: id
                });
                peer.start("friend", self.userName);
                friends.push(peer);
            }
        }
        self.webrtc.friends.forEach(function(peer) {
            if(friends.indexOf(peer) < 0) {
                peer.pc.close();
            }
        });
        self.webrtc.friends = friends;
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
        this.userName = name;
    }
};


/**
 * Send a private message to a user
 * @name {string}
 * @message {string}
 */

Talk.prototype.sendPrivateMessage = function(name, message) {
    this.webrtc.friends.forEach(function(peer) {
        if(peer.user === name) {
            peer.send("pm", message);
        }
    });
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