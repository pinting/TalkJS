var attachMediaStream = require("attachmediastream");
var WildEmitter = require("wildemitter");
var RoomPeer = require("./room");
var Util = require("../util");
var RTC = require("../rtc");

/**
 * A peer: child of Peer from SimpleWebRTC
 * @options {object}
 */

function FriendPeer(options) {
    RoomPeer.call(this, options);
}

Util.inherits(FriendPeer, RoomPeer);

/**
 * Handle message
 * @message {object}
 */

FriendPeer.prototype.handleMessage = function(message) {
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
            this.parent.emit("friendMessage", self, Util.safeText(message.payload));
            break;
    }
    this.logger.log("Getting:", message.type, message);
};

/**
 * Send a message
 * @type {string}
 * @payload {object}
 * @username {string} Username of the sender (optional)
 */

FriendPeer.prototype.send = function(type, payload, username) {
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
                this.parent.emit("message", "friend", message);
            }
            break;
        default:
            this.parent.emit("message", "friend", message);
            break;
    }
    this.logger.log("Sending:", type, message);
};

/**
 * Handle when a remote stream is removed
 */

FriendPeer.prototype.handleStreamRemoved = function() {
    this.parent.peers.friend.splice(this.parent.peers.room.indexOf(this), 1);
    this.closed = true;
    this.parent.emit("peerStreamRemoved", this);
};

module.exports = FriendPeer;