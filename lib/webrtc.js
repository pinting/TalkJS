var parent = require("./simplewebrtc/webrtc");
var hark = require("./simplewebrtc/hark");
var Peer = require("./peer");

/**
 * Peer handler object, child of WebRTC from SimpleWebRTC bundle
 * @options {object}
 */

function WebRTC(options) {
    parent.call(this, options);
}

inherits(WebRTC, parent);

/**
 * Create a peer object through the handler
 * @options {object} Options for the peer
 */

WebRTC.prototype.createPeer = function(options) {
    var peer;
    options.parent = this;
    peer = new Peer(options);
    return peer;
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

    this.logger.log("Setup audio");

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
};

module.exports = WebRTC;