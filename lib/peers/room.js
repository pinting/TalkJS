var attachMediaStream = require("attachmediastream");
var WildEmitter = require("wildemitter");
var webrtc = require("webrtcsupport");
var PeerConnection = require("../pc");
var Util = require("../util");
var RTC = require("../rtc");

/**
 * A peer: child of Peer from SimpleWebRTC
 * @options {object}
 */

function RoomPeer(options) {
    WildEmitter.call(this);

    var self = this;
    this.username = Util.safeStr(options.username) || "";
    this.oneway = options.oneway || false;
    this.logger = options.parent.logger;
    this.type = options.type || "data";
    this.prefix = options.prefix;
    this.parent = options.parent;
    this.stream = options.stream;
    this.id = options.id;
    this.element = null;
    this.channels = {};

    this.pc = new PeerConnection(this.parent.config.peerConnectionConfig, this.parent.config.peerConnectionContraints);
    this.pc.on("negotiationNeeded", this.emit.bind(this, "negotiationNeeded"));
    this.pc.on("addStream", this.handleRemoteStreamAdded.bind(this));
    this.pc.on("addChannel", this.handleDataChannelAdded.bind(this));
    this.pc.on("removeStream", this.handleStreamRemoved.bind(this));
    this.pc.on("ice", this.onIceCandidate.bind(this));

    if(Util.find(["audio", "video"], this.type)) {
        if(Util.isObject(this.parent.localStream)) {
            this.pc.addStream(this.parent.localStream);
        }
    }

    if(!Util.isObject(this.createDataChannel("default", {reliable: true}))) {
        this.logger.warn("Failed to create reliable data channel.");
        if(!Util.isObject(this.createDataChannel("default", {reliable: false, preset: true}))) {
            this.logger.warn("Failed to create unreliable data channel.");
        }
    }

    this.on("*", function() {
        self.parent.emit.apply(self.parent, arguments);
    });
}

Util.inherits(RoomPeer, require("../simplewebrtc/peer"));

/**
 * Create an offer
 * @type {string} Type of the offer
 * @user {string}
 */

RoomPeer.prototype.start = function(username) {
    var self = this;
    this.pc.offer({
        mandatory: {
            OfferToReceiveAudio: this.parent.config.media.audio,
            OfferToReceiveVideo: this.parent.config.media.video
        }
    }, function(error, description) {
        self.send("offer", description, username);
    });
};

/**
 * Handle message
 * @message {object}
 */

RoomPeer.prototype.handleMessage = function(message) {
    var self = this;

    if(!Util.isObject(message)) {
        return;
    }
    if(message.prefix) {
        this.prefix = message.prefix;
    }
    switch(message.type) {
        case "offer":
            this.pc.answer(message.payload, function(error, description) {
                if(!Util.isNone(error)) {
                    self.logger.warn(error);
                }
                self.send("answer", description);
            });
            break;
        case "answer":
            this.pc.handleAnswer(message.payload);
            break;
        case "candidate":
            this.pc.processIce(message.payload);
            break;
        case "setName":
            this.username = Util.safeStr(message.payload) || "";
            this.parent.emit("nameChanged", self);
            break;
        case "stoppedSpeaking":
            this.parent.emit("stoppedSpeaking", self);
            break;
        case "speaking":
            this.parent.emit("speaking", self);
            break;
        case "chat":
            this.parent.emit("roomMessage", self, Util.safeText(message.payload));
            break;
    }
    this.logger.log("Getting:", message.type, message);
};

/**
 * Create a data channel
 * @name {string}
 * @options {object}
 */

RoomPeer.prototype.createDataChannel = function(name, options) {
    var self = this;
    var channel;
    var message;

    try {
        channel = this.pc.createDataChannel(name, options);
        channel.onclose = function(event) {
            self.emit("channelClosed", event);
        };
        channel.onerror = function(event) {
            self.emit("channelError", event);
        };
        channel.onopen = function(event) {
            self.emit("channelOpened", event);
        };
        channel.onmessage = function(event) {
            message = JSON.parse(event.data);
            message.from = self.id;
            self.handleMessage(message);
            self.emit("channelMessage", message, self, event);
            self.logger.log("Getting through RTCDataChannel:", message.type, message);
        };
        self.channels[name] = channel;
        return channel;
    }
    catch(e) {
        this.logger.warn("Failed to create a data channel", e.message);
        return false;
    }
};

/**
 * Send data thought the specific channel
 * @channel {object}
 * @message {object}
 */

RoomPeer.prototype.sendData = function(channel, message) {
    if(Util.isObject(this.channels[channel])) {
        try {
            this.channels[channel].send(JSON.stringify(message));
            return true;
        }
        catch(e) {
            this.logger.warn("Failed to send data through RTCDataChannel", e.message);
            return false;
        }
    }
    return false;
};

/**
 * Send a message
 * @type {string}
 * @payload {object}
 * @username {string} Username of the sender (optional)
 */

RoomPeer.prototype.send = function(type, payload, username) {
    var message = {
        nameMe: username || null,
        roomType: this.type,
        prefix: RTC.prefix,
        payload: payload,
        to: this.id,
        type: type
    };
    switch(type) {
        case "stoppedSpeaking":
        case "speaking":
        case "chat":
            if(!this.sendData("default", message)) {
                this.logger.warn("Fallback to Socket.IO");
                this.parent.emit("message", "room", message);
            }
            break;
        default:
            this.parent.emit("message", "room", message);
            break;
    }
    this.logger.log("Sending:", type, message);
};

/**
 * Handle data channel when its added
 * @channel {object}
 */

RoomPeer.prototype.handleDataChannelAdded = function(channel) {
    this.channels[channel.name] = channel;
};

/**
 * Handle when a new remote stream is added
 * @event {object}
 */

RoomPeer.prototype.handleRemoteStreamAdded = function(event) {
    if(this.stream) {
        this.logger.warn("Already have a remote stream");
    }
    else {
        if(Util.find(["audio", "video"], this.type)) {
            this.element = attachMediaStream(event.stream, document.createElement(this.type));
            this.element.id = [this.id, this.type].join("_");
        }
        this.stream = event.stream;
        this.parent.emit("peerStreamAdded", this);
    }
};

/**
 * Handle when a remote stream is removed
 */

RoomPeer.prototype.handleStreamRemoved = function() {
    this.parent.peers.room.splice(this.parent.peers.room.indexOf(this), 1);
    this.closed = true;
    this.parent.emit("peerStreamRemoved", this);
};

/**
 * Unmute the media element
 */

RoomPeer.prototype.unmuteElement = function() {
    if(Util.isObject(this.element)) {
        this.element.muted = false;
    }
};

/**
 * Mute the media element
 */

RoomPeer.prototype.muteElement = function() {
    if(Util.isObject(this.element)) {
        this.element.muted = true;
    }
};

/**
 * Set volume for the media element
 * @volume {int}
 */

RoomPeer.prototype.setElementVolume = function(volume) {
    if(Util.isObject(this.element)) {
        this.element.volume = volume / 100;
    }
};

module.exports = RoomPeer;