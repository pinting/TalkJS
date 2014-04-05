var parent = require("./simplewebrtc/webrtc");
var getUserMedia = require("getusermedia");
var hark = require("./simplewebrtc/hark");
var mockconsole = require("mockconsole");
var WildEmitter = require("wildemitter");
var RTC = require("./adapter");
var Peer = require("./peer");

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
        enableDataChannels: true,
        autoRequestMedia: false,
        autoAdjustMic: false,
        debug: false
    };
    this.localStream = null;
    this.friends = [];
    this.peers = [];
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

    if (!isObject(RTC.pc)) {
        this.logger.error("Your browser doesn't seem to support WebRTC");
    }
}

inherits(WebRTC, parent);

/**
 * Get peers by id and type
 * @id {int}
 * @type {string}
 */

WebRTC.prototype.getPeers = function(id, type) {
    var handler = function(peer) {
        return (isNone(id) || peer.id === id) && (!find(["audio", "video", "data"], type) || peer.type === type);
    };
    return this.peers.filter(handler).concat(this.friends.filter(handler));
};

/**
 * Handle an incoming message
 * @message {object}
 */

WebRTC.prototype.handleMessage = function(message, peer) {
    peer = peer || this.getPeers(message.from, message.roomType)[0];
    switch(message.type) {
        case "offer":
            if(isNone(peer)) {
                peer = this.createPeer({
                    type: message.roomType,
                    user: message.nameMe,
                    id: message.from
                });
                this.peers.push(peer);
                peer.handleMessage(message);
            }
            break;
        case "friend":
            if(isNone(peer)) {
                peer = this.createPeer({
                    user: message.nameMe,
                    id: message.from,
                    type: "data"
                });
                this.friends.push(peer);
                peer.handleMessage(message);
            }
            break;
    }
    if(isObject(peer)) {
        peer.handleMessage(message);
    }
};

/**
 * Create a peer object through the handler
 * @options {object} Options for the peer
 */

WebRTC.prototype.createPeer = function(options) {
    options.parent = this;
    return new Peer(options);
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
            self.sendToAll("stopped_speaking", {});
            self.emit("localStoppedSpeaking");
        }, 200);
    });
    this.logger.log("Audio monitor have started");
};

module.exports = WebRTC;