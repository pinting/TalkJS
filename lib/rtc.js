var Util = require("./util");
var exports = {
    desc: window.RTCSessionDescription,
    pc: window.RTCPeerConnection,
    ice: window.RTCIceCandidate,
    version: 0,
    prefix: ""
};

if(Util.isObject(window.mozRTCPeerConnection)) {
    exports.version = parseInt((navigator.userAgent.match(/Firefox\/([0-9]+)\./) || 0)[1]);
    exports.prefix = "moz";
    exports.desc = window.mozRTCSessionDescription;
    exports.pc = window.mozRTCPeerConnection;
    exports.ice = window.mozRTCIceCandidate;
}
else if(Util.isObject(window.webkitRTCPeerConnection)) {
    exports.version = parseInt((navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./) || 0)[2]);
    exports.prefix = "webkit";
    exports.pc = webkitRTCPeerConnection;
}

module.exports = exports;