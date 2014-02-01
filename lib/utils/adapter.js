/**
 * WebRTC polyfill to support as many browsers as possible.
 */

var RTCDetectedVersion = 0;
var RTCDetectedPrefix = "";

if(isObject(window.mozRTCPeerConnection)) {
    RTCDetectedVersion = parseInt(navigator.userAgent.match(/Firefox\/([0-9]+)\./)[1], 10);
    RTCDetectedPrefix = "moz";

    window.RTCPeerConnection = window.mozRTCPeerConnection;
    window.RTCSessionDescription = window.mozRTCSessionDescription;
    window.RTCIceCandidate = window.mozRTCIceCandidate;
}
else if(isObject(window.webkitRTCPeerConnection)) {
    RTCDetectedVersion = parseInt(navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)[2], 10);
    RTCDetectedPrefix = "webkit";

    window.RTCPeerConnection = webkitRTCPeerConnection;
}
else if(isObject(window.w4aPeerConnection)) {
    RTCDetectedPrefix = "w4a";

    window.RTCPeerConnection = window.w4aPeerConnection;
    window.RTCSessionDescription = window.w4aSessionDescription;
    window.RTCIceCandidate = window.w4aIceCandidate;

    WebRtc4all_Init();
}