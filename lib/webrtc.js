var parent = require("webrtc");
var Peer = require("./peer");
var hark = require("hark");

/**
 * Peer handler object, child of WebRTC from SimpleWebRTC bundle
 * @options {object}
 */

function WebRTC(options) {
    parent.call(this, options);
}

WebRTC.prototype = Object.create(parent.prototype, {
    constructor: {
        value: WebRTC
    }
});

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
        threshold: -70,
        interval: 200
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
        }, 1000);
    });
};

module.exports = WebRTC;