var GainController = require("./simplewebrtc/gain");
var getUserMedia = require("getusermedia");
var FriendPeer = require("./peer/friend");
var hark = require("./simplewebrtc/hark");
var mockconsole = require("mockconsole");
var WildEmitter = require("wildemitter");
var RoomPeer = require("./peer/room");
var Util = require("./util");
var RTC = require("./rtc");

/**
 * Handler object for WebRTC peers
 * @options {object}
 */

function WebRTC(options) {
    WildEmitter.call(this);

    this.config = {
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
        detectSpeakingEvents: false,
        peerVolumeWhenSpeaking: 50,
        adjustPeerVolume: false,
        autoAdjustMic: false,
        debug: false
    };
    this.peers = {
        friend: [],
        room: []
    };
    this.localStream = null;
    var volumes = {};
    var self = this;
    var item;

    for(item in options || {}) {
        if(!Util.isNone(options[item])) {
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

    if(this.config.adjustPeerVolume) {
        this.on("localSpeaking", function() {
            self.peers.room.forEach(function(peer) {
                if(Util.isNone(volumes[peer.id])) {
                    if(self.config.peerVolumeWhenSpeaking < peer.element.volume * 100) {
                        volumes[peer.id] = peer.element.volume * 100;
                        self.setVolume(peer, self.config.peerVolumeWhenSpeaking);
                    }
                }
            });
        });
        this.on("localStoppedSpeaking", function() {
            self.peers.room.forEach(function(peer) {
                if(Util.isNumber(volumes[peer.id])) {
                    if(self.config.peerVolumeWhenSpeaking == peer.element.volume * 100) {
                        self.setVolume(peer, volumes[peer.id]);
                    }
                    delete volumes[peer.id];
                }
            });
        });
    }

    if(!Util.isObject(RTC.pc)) {
        this.logger.error("Your browser doesn't seem to support WebRTC");
    }
}

Util.inherits(WebRTC, require("./simplewebrtc/webrtc"));

/**
 * Start local media
 * @media {object} Type of the local stream
 * @cb {function}
 */

WebRTC.prototype.startLocalMedia = function(media, cb) {
    var self = this;

    if(!Util.isObject(media) || !Util.isBool(media.audio) || !Util.isBool(media.video)) {
        media = {audio: true, video: true};
    }
    this.config.media = media;
    getUserMedia(media, function(error, stream) {
        if(Util.isNone(error)) {
            if(Util.isBool(media.audio) && self.config.detectSpeakingEvents) {
                self.setupAudioMonitor(stream);
            }
            if(self.config.autoAdjustMic) {
                self.gainController = new GainController(stream);
                self.setMicIfEnabled(0.5);
            }
            self.localStream = stream;
            self.emit("localStream", stream);
        }
        else {
            self.logger.warn("Error has occurred while starting local media:", error);
        }
        Util.safeCb(cb)(error, stream);
    });
};

/**
 * Get peers by id and type
 * @args {object}
 */

WebRTC.prototype.getRoomPeer = function(args) {
    return this.peers.room.filter(function(peer) {
        return (!Util.find(["audio", "video", "data"], args.type) || peer.type === args.type) &&
               (Util.isNone(args.username) || peer.username === args.username) &&
               (Util.isNone(args.id) || peer.id === args.id);
    })[0];
};

/**
 * Get friends by id, type and username
 * @args {object}
 */

WebRTC.prototype.getFriendPeer = function(args) {
    return this.peers.friend.filter(function(peer) {
        return (Util.isNone(args.username) || peer.username === args.username) &&
               (Util.isNone(args.type) || peer.type === args.type) &&
               (Util.isNone(args.id) || peer.id === args.id);
    })[0];
};

/**
 * Handle an incoming message from a peer
 * @message {object}
 * @peer {object}
 */

WebRTC.prototype.handleRoomMessage = function(message, peer) {
    peer = peer || this.getRoomPeer({id: message.from, type: message.roomType}) || null;
    if(message.type === "offer") {
        if(Util.isNone(peer)) {
            peer = this.createRoomPeer({
                username: message.nameMe,
                type: message.roomType,
                id: message.from
            });
            peer.handleMessage(message);
        }
    }
    if(Util.isObject(peer)) {
        peer.handleMessage(message);
    }
};

/**
 * Handle an incoming message from a friend
 * @message {object}
 * @peer {object}
 */

WebRTC.prototype.handleFriendMessage = function(message, peer) {
    peer = peer || this.getFriendPeer({id: message.from, type: message.roomType}) || null;
    if(message.type === "offer") {
        if(Util.isNone(peer)) {
            peer = this.createFriendPeer({
                username: message.nameMe,
                id: message.from,
                type: "data"
            });
            peer.handleMessage(message);
        }
    }
    if(Util.isObject(peer)) {
        peer.handleMessage(message);
    }
};

/**
 * Create a peer object
 * @options {object}
 */

WebRTC.prototype.createRoomPeer = function(options) {
    options.parent = this;
    var peer = new RoomPeer(options);
    this.peers.room.push(peer);
    return peer;
};

/**
 * Create a friend object
 * @options {object}
 */

WebRTC.prototype.createFriendPeer = function(options) {
    options.parent = this;
    var peer = new FriendPeer(options);
    this.peers.friend.push(peer);
    return peer;
};

/**
 * Setup audio monitor for a stream
 * @stream {object}
 */

WebRTC.prototype.setupAudioMonitor = function(stream) {
    var timeout;
    var self = this;
    var audio = hark(stream, {
        threshold: -65,
        interval: 1000
    });

    audio.on("speaking", function() {
        if(self.hardMuted) {
            return;
        }
        self.setMicIfEnabled(1);
        self.sendInRoom("speaking", {});
        self.emit("localSpeaking");
    });

    audio.on("stopped_speaking", function() {
        if(self.hardMuted) {
            return;
        }
        if(timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(function() {
            self.setMicIfEnabled(0.5);
            self.sendInRoom("stoppedSpeaking", {});
            self.emit("localStoppedSpeaking");
        }, 200);
    });
    this.logger.log("Audio monitor has started");
};

/**
 * Mute all audio/video elements of peers in the current room
 */

WebRTC.prototype.muteRoom = function() {
    this.peers.room.forEach(function(peer) {
        peer.mute();
    });
};

/**
 * Unmute all audio/video elements of peers in the current room
 */

WebRTC.prototype.unmuteRoom = function() {
    this.peers.room.forEach(function(peer) {
        peer.unmute();
    });
};

/**
 * Set volume for all audio/video elements of peers in the current room
 * @volume {int}
 */

WebRTC.prototype.setRoomVolume = function(volume) {
    this.peers.room.forEach(function(peer) {
        peer.setVolume(volume);
    });
};


/**
 * Send a message to everyone in the current room
 * @type {string}
 * @payload {string}
 */

WebRTC.prototype.sendInRoom = function(type, payload) {
    this.peers.room.forEach(function(peer) {
        peer.send(type, payload);
    });
};


/**
 * Send a private message to every friends
 * @type {string}
 * @payload {string}
 */

WebRTC.prototype.sendToFriends = function(type, payload) {
    this.peers.friend.forEach(function(peer) {
        peer.send(type, payload);
    });
};

module.exports = WebRTC;