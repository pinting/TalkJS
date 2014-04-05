var attachMediaStream = require("attachmediastream");
var WildEmitter = require("wildemitter");
var webrtc = require("webrtcsupport");
var PeerConnection = require("./pc");
var RTC = require("./adapter");

/**
 * A peer: child of Peer from SimpleWebRTC
 * @options {object}
 */

function Peer(options) {
    WildEmitter.call(this);

    var self = this;
    this.user = safeStr(options.user) || "";
    this.oneway = options.oneway || false;
    this.logger = options.parent.logger;
    this.type = options.type || "audio";
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

    switch(options.type) {
        case "audio":
        case "video":
            if(isObject(this.parent.localStream)) {
                this.pc.addStream(this.parent.localStream);
            }
            break;
    }

    if(!isObject(this.createDataChannel("default", {reliable: true}))) {
        this.logger.warn("Failed to create reliable data channel.");
        if(!isObject(this.createDataChannel("default", {reliable: false}))) {
            this.logger.warn("Failed to create unreliable data channel.");
        }
    }

    this.on("*", function() {
        self.parent.emit.apply(self.parent, arguments);
    });
}

inherits(Peer, require("./simplewebrtc/peer"));

/**
 * Create a data channel
 * @name {string}
 * @options {object}
 */

Peer.prototype.createDataChannel = function(name, options) {
    var channel = this.pc.createDataChannel(name, options);
    var self = this;
    var message;

    try {
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
            self.emit("channelMessage", message, self, event);
            self.logger.log("Getting through RTCDataChannel:", message.type, message);
        };
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

Peer.prototype.sendData = function(channel, message) {
    if(isObject(this.channels[channel])) {
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
 * Handle data channel when its added
 * @channel {object}
 */

Peer.prototype.handleDataChannelAdded = function(channel) {
    this.channels[channel.name] = channel;
};

/**
 * Handle message
 * @message {object}
 */

Peer.prototype.handleMessage = function(message) {
    var self = this;

    if(!isObject(message)) {
        return;
    }
    if(message.prefix) {
        this.prefix = message.prefix;
    }
    switch(message.type) {
        case "friend":
        case "offer":
            this.pc.answer(message.payload, function (error, description) {
                if(error) {
                    self.logger.warn(error);
                }
                self.send("answer", description);
            });
            break;
        case "stopped_speaking":
            this.parent.emit("stoppedSpeaking", self);
            break;
        case "speaking":
            this.parent.emit("speaking", self);
            break;
        case "candidate":
            this.pc.processIce(message.payload);
            break;
        case "set_name":
            this.user = safeStr(message.payload) || "";
            this.parent.emit("nameChanged", self);
            break;
        case "answer":
            this.pc.handleAnswer(message.payload);
            break;
        case "chat":
            this.parent.emit("chat", self, safeText(message.payload));
            break;
        case "pm":
            this.parent.emit("pm", self, safeText(message.payload));
            break;
    }
    this.logger.log("Getting:", message.type, message);
};

/**
 * Send a message
 * @type {string}
 * @payload {object}
 * @user {string} Username of the sender (optional)
 */

Peer.prototype.send = function(type, payload, user) {
    var message = {
        nameMe: user || null,
        roomType: this.type,
        prefix: RTC.prefix,
        payload: payload,
        to: this.id,
        type: type
    };
    switch(type) {
        case "stopped_speaking":
        case "speaking":
        case "chat":
        case "pm":
            if(!this.sendData("default", message)) {
                this.logger.warn("Fallback to Socket.IO");
                this.parent.emit("message", message);
            }
            break;
        default:
            this.parent.emit("message", message);
            break;
    }
    this.logger.log("Sending:", type, message);
};

/**
 * Create an offer
 * @type {string} Type of the offer (offer/friend)
 * @user {string}
 */

Peer.prototype.start = function(type, user) {
    var self = this;
    this.pc.offer({
        mandatory: {
            OfferToReceiveAudio: this.parent.config.media.audio,
            OfferToReceiveVideo: this.parent.config.media.video
        }
    }, function(error, description) {
        self.send((type || "offer"), description, user);
    });
};

Peer.prototype.handleRemoteStreamAdded = function(event) {
    if(this.stream) {
        this.logger.warn("Already have a remote stream");
    }
    else {
        if(find(["audio", "video"], this.type)) {
            this.element = attachMediaStream(event.stream, document.createElement(this.type));
            this.element.id = [this.id, this.type].join("_");
        }
        this.stream = event.stream;
        this.parent.emit("peerStreamAdded", this);
    }
};

module.exports = Peer;