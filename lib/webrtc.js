var GainController = require("./simplewebrtc/gain");
var FriendPeer = require("./peers/friend");
var getUserMedia = require("getusermedia");
var hark = require("./simplewebrtc/hark");
var mockconsole = require("mockconsole");
var WildEmitter = require("wildemitter");
var RoomPeer = require("./peers/room");
var RTC = require("./rtc");

/**
 * Peer handler object, child of WebRTC from SimpleWebRTC bundle
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
        detectSpeakingEvents: true,
        peerVolumeWhenSpeaking: 50,
        adjustPeerVolume: false,
        autoAdjustMic: false,
        debug: true
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

    if(this.config.adjustPeerVolume) {
        this.on("localSpeaking", function() {
            self.peers.room.forEach(function(peer) {
                if(isNone(volumes[peer.id])) {
                    if(self.config.peerVolumeWhenSpeaking < peer.element.volume * 100) {
                        volumes[peer.id] = peer.element.volume * 100;
                        self.setElementVolume(peer, self.config.peerVolumeWhenSpeaking);
                    }
                }
            });
        });
        this.on("localStoppedSpeaking", function() {
            self.peers.room.forEach(function(peer) {
                if(isNumber(volumes[peer.id])) {
                    if(self.config.peerVolumeWhenSpeaking == peer.element.volume * 100) {
                        self.setElementVolume(peer, volumes[peer.id]);
                    }
                    delete volumes[peer.id];
                }
            });
        });
    }

    if(!isObject(RTC.pc)) {
        this.logger.error("Your browser doesn't seem to support WebRTC");
    }
}

inherits(WebRTC, require("./simplewebrtc/webrtc"));

/**
 * Start local media
 * @media {object} Type of the local stream
 * @cb {function}
 */

WebRTC.prototype.startLocalMedia = function(media, cb) {
    var self = this;

    if(!isObject(media) || !isBool(media.audio) || !isBool(media.video)) {
        media = {audio: true, video: true};
    }
    this.config.media = media;
    getUserMedia(media, function(error, stream) {
        if(isNone(error)) {
            if(isBool(media.audio) && self.config.detectSpeakingEvents) {
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
        safeCb(cb)(error, stream);
    });
};

/**
 * Get peers by id and type
 * @id {string}
 * @type {string}
 */

WebRTC.prototype.getRoomPeer = function(args) {
    return this.peers.room.filter(function(peer) {
        return (!find(["audio", "video", "data"], args.type) || peer.type === args.type) &&
               (isNone(args.id) || peer.id === args.id);
    })[0];
};

/**
 * Get friends by id and type
 * @id {string}
 * @type {string}
 */

WebRTC.prototype.getFriendPeer = function(args) {
    return this.peers.friend.filter(function(peer) {
        return (isNone(args.username) || peer.username === args.username) &&
               (isNone(args.type) || peer.type === args.type) &&
               (isNone(args.id) || peer.id === args.id);
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
        if(isNone(peer)) {
            peer = this.createRoomPeer({
                username: message.nameMe,
                type: message.roomType,
                id: message.from
            });
            this.peers.room.push(peer);
            peer.handleMessage(message);
        }
    }
    if(isObject(peer)) {
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
        if(isNone(peer)) {
            peer = this.createFriendPeer({
                username: message.nameMe,
                id: message.from
            });
            this.peers.friend.push(peer);
            peer.handleMessage(message);
        }
    }
    if(isObject(peer)) {
        peer.handleMessage(message);
    }
};

/**
 * Create a peer object through the handler
 * @options {object} Options for the peer
 */

WebRTC.prototype.createRoomPeer = function(options) {
    options.parent = this;
    return new RoomPeer(options);
};

/**
 * Create a friend object through the handler
 * @options {object} Options for the friend
 */

WebRTC.prototype.createFriendPeer = function(options) {
    options.parent = this;
    return new FriendPeer(options);
};

/**
 * Setup audio monitor for a (local) stream
 * @stream {object} Local stream
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
        self.sendToAll("speaking", {});
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
            self.sendToAll("stoppedSpeaking", {});
            self.emit("localStoppedSpeaking");
        }, 200);
    });
    this.logger.log("Audio monitor has started");
};

/**
 * Mute all audio/video element of peers in the current room
 */

WebRTC.prototype.muteElementForAll = function() {
    this.peers.room.forEach(function(peer) {
        peer.muteElement();
    });
};

/**
 * Unmute all audio/video element of peers in the current room
 */

WebRTC.prototype.unmuteElementForAll = function() {
    this.peers.room.forEach(function(peer) {
        peer.unmuteElement();
    });
};

/**
 * Set volume for all audio/video element of peers in the current room
 * @volume {int}
 */

WebRTC.prototype.setElementVolumeForAll = function(volume) {
    this.peers.room.forEach(function(peer) {
        peer.setElementVolume(volume);
    });
};


/**
 * Send a message to everyone in the same room
 * @type {string}
 * @payload {string}
 */

WebRTC.prototype.sendToAll = function(type, payload) {
    this.peers.room.forEach(function(peer) {
        peer.send(type, payload);
    });
};


/**
 * Send a private message to every friends
 * @type {string}
 * @payload {string}
 */

WebRTC.prototype.sendToAllFriends = function(type, payload) {
    this.peers.friend.forEach(function(peer) {
        peer.send(type, payload);
    });
};

module.exports = WebRTC;