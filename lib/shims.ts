declare var navigator: any;
declare var window: any;

class Shims {
    static getUserMedia(...args: any[]) {
        (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia).apply(navigator, args);
    }
    static SessionDescription = window.RTCSessionDescription || window.webkitRTCSessionDescription || window.mozRTCSessionDescription;
    static PeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
    static IceCandidate = window.RTCIceCandidate || window.webkitRTCIceCandidate ||window.mozRTCIceCandidate;
}

export = Shims;