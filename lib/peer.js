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
    this.channels = {};

    this.on("*", function () {
        self.parent.emit.apply(self.parent, arguments);
    });

    this.pc = new PeerConnection(this.parent.config.peerConnectionConfig, this.parent.config.peerConnectionContraints);
    this.pc.on("negotiationNeeded", this.emit.bind(this, "negotiationNeeded"));
    this.pc.on("addStream", this.handleRemoteStreamAdded.bind(this));
    this.pc.on("addChannel", this.handleDataChannelAdded.bind(this));
    this.pc.on("removeStream", this.handleStreamRemoved.bind(this));
    this.pc.on("ice", this.onIceCandidate.bind(this));

    switch(options.type) {
        case "text":
            break;
        default:
            this.pc.addStream(this.parent.localStream);
            break;
    }

    if(this.parent.config.enableDataChannels && webrtc.dataChannel) {
        try {
            this.reliableChannel = this.getDataChannel("reliable", {reliable: true});
        }
        catch(e) {
            this.logger.warn("Failed to create reliable data channel.");
            this.reliableChannel = false;
            delete this.channels.reliable;
        }
        try {
            this.unreliableChannel = this.getDataChannel("unreliable", {reliable: false, preset: true});
        }
        catch(e) {
            this.logger.warn("Failed to create unreliable data channel.");
            this.unreliableChannel = false;
            delete this.channels.unreliableChannel;
        }
    }
}

inherits(Peer, require("./simplewebrtc/peer"));

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
        case "answer":
            this.pc.handleAnswer(message.payload);
            break;
        case "candidate":
            this.pc.processIce(message.payload);
            break;
        case "speaking":
            this.parent.emit("speaking", {id: message.from});
            break;
        case "stopped_speaking":
            this.parent.emit("stopped_speaking", {id: message.from});
            break;
    }
    this.logger.log("getting", message.type, message);
};

/**
 * Create an offer
 * @type {string}
 * @payload {object}
 * @user {string}
 */

Peer.prototype.send = function(type, payload, user) {
    var message = {
        broadcaster: this.broadcaster,
        prefix: RTC.prefix,
        roomType: this.type,
        user: user || null,
        payload: payload,
        to: this.id,
        type: type
    };
    this.logger.log("sending", type, message);
    this.parent.emit("message", message);
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

module.exports = Peer;