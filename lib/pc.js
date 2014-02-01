var parent = require("rtcpeerconnection");
var WildEmitter = require("wildemitter");

/**
 * Simpler object for adapter: child of PeerConnection from SimpleWebRTC
 * @options {object}
 */

function PeerConnection(config, constraints) {
    WildEmitter.call(this);

    var item;

    this.pc = new RTCPeerConnection(config, constraints);
    this.pc.onremovestream = this.emit.bind(this, "removeStream");
    this.pc.onnegotiationneeded = this.emit.bind(this, "negotiationNeeded");
    this.pc.oniceconnectionstatechange = this.emit.bind(this, "iceConnectionStateChange");
    this.pc.onsignalingstatechange = this.emit.bind(this, "signalingStateChange");

    this.pc.onaddstream = this._onAddStream.bind(this);
    this.pc.onicecandidate = this._onIce.bind(this);
    this.pc.ondatachannel = this._onDataChannel.bind(this);

    this.config = {
        debug: false,
        sdpHack: true
    };
    for(item in config) {
        this.config[item] = config[item];
    }
    if(this.config.debug) {
        this.on("*", function(eventName, event) {
            var logger = config.logger || console;
            logger.log("PeerConnection event:", arguments);
        });
    }
}

PeerConnection.prototype = Object.create(parent.prototype, {
    constructor: {
        value: PeerConnection
    }
});

/**
 * Process candidate description
 * @candidate {object}
 */

PeerConnection.prototype.processIce = function(candidate) {
    this.pc.addIceCandidate(new RTCIceCandidate(candidate));
};

/**
 * Handle an answer description
 * @candidate {object}
 */

PeerConnection.prototype.handleAnswer = function(answer) {
    this.pc.setRemoteDescription(new RTCSessionDescription(answer));
};

/**
 * SDP hack for Chrome, from PeerJS
 * @sdp {string}
 */

PeerConnection.prototype._applySdpHack = function(sdp) {
    if(RTCDetectedPrefix === "webkit" && RTCDetectedVersion < 31) {
        var parts = sdp.split("b=AS:30");
        var replace = "b=AS:102400";
        if(parts.length > 1) {
            return parts[0] + replace + parts[1];
        }
    }
    return sdp;
};

/**
 * Internal code sharing for various types of answer methods
 * @offer {object} Offer description
 * @constraints {object} Media type
 * @cb {string}
 */

PeerConnection.prototype._answer = function(offer, constraints, cb) {
    var self = this;
    this.pc.setRemoteDescription(new RTCSessionDescription(offer));
    this.pc.createAnswer(function(answer) {
            answer.sdp = self._applySdpHack(answer.sdp);
            self.pc.setLocalDescription(answer);
            self.emit("answer", answer);
            safeCb(cb)(null, answer);
        }, function(error) {
            self.emit("error", error);
            safeCb(cb)(error);
        }, constraints
    );
};

module.exports = PeerConnection;
