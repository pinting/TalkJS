/// <reference path="./Definitions/socket.io-client" />
/// <reference path="./Definitions/RTCPeerConnection" />
/// <reference path="./Definitions/Wildemitter" />
/// <reference path="./Definitions/Navigator" />
/// <reference path="./Definitions/Window" />

module Talk {
    export var PeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
    export var SessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription;
    export var IceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate;
    export var MediaStream = window.MediaStream || window.webkitMediaStream;
    export var URL = window.URL || window.webkitURL;

    export var userMedia: LocalMediaStream;

    export var warn = noop;
    export var log = noop;

    /**
     * Check if SCTP data channels are supported
     */

    export var sctp = (function() {
        var pc = new PeerConnection({
            iceServers: [
                {"url": "stun:stun.l.google.com:19302"}
            ]
        }, {});
        try {
            var dc = pc.createDataChannel("_test", <RTCDataChannelInit> {});
            pc.close();
            return dc.reliable || false;
        }
        catch(e) {
            pc.close();
            return false;
        }
    })();

    /**
     * Check if negotiations are supported
     */

    export var negotiations = (function() {
        var pc = new PeerConnection({
            iceServers: [
                {"url": "stun:stun.l.google.com:19302"}
            ]
        }, {
            optional: [
                {RtpDataChannels: true}
            ]
        });
        pc.onnegotiationneeded = function() {
            negotiations = true;
        };
        pc.createDataChannel("_test");

        setTimeout(function() {
            pc.close();
        }, 1000);

        return false;
    })();

    /**
     * Set a new logger
     * @param obj
     */

    export function logger(obj: ILogger): void {
        if(obj.warn) {
            warn = obj.warn.bind(obj);
        }
        if(obj.log) {
            log = obj.log.bind(obj);
        }
    }

    /**
     * Get user media
     * @param [audio]
     * @param [video]
     * @param [cb]
     */

    export function getUserMedia(audio = true, video = true, cb?: (error: any, stream?: MediaStream) => void): MediaStream {
        if(userMedia && !userMedia.ended) {
            return userMedia;
        }
        // Workaround to avoid illegal invocation error
        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
        navigator.getUserMedia(
            {
                audio: audio,
                video: video
            },
            (stream: LocalMediaStream) => {
                log("User media request was successful");
                userMedia = stream;
                safeCb(cb)(null, stream);
            },
            (error: Error) => {
                if(video && error && error.name === "DevicesNotFoundError") {
                    // Fallback to audio-only stream on Chrome
                    getUserMedia(true, false, safeCb(cb));
                }
                else {
                    warn(error);
                    safeCb(cb)(error);
                }
            }
        );
    }

    /**
     * Attach stream to an element
     * @param element
     * @param stream
     */

    export function attachMediaStream(element: HTMLVideoElement, stream: MediaStream): HTMLVideoElement {
        if(URL) {
            element.src = URL.createObjectURL(stream);
        }
        else {
            element.src = <any> stream;
        }
        element.autoplay = true;
        return element;
    }

    /**
     * Check if input is a function: if it is not, then return an empty function
     * @param obj
     */

    export function safeCb(obj: any): (...args: any[]) => any {
        if(typeof obj === "function") {
            return obj;
        }
        else {
            return noop;
        }
    }

    /**
     * Remove unwanted characters from a string
     * @param obj
     */

    export function safeStr(obj: any): string {
        return obj.replace(/\s/g, "-").replace(/[^A-Za-z0-9_\-]/g, "").toString();
    }

    /**
     * Check if object is function
     * @param obj
     */

    export function isFunc(obj: any): boolean {
        return typeof obj === "function";
    }

    /**
     * Check if object is empty
     * @param {Array|Object|string} obj
     */

    export function isEmpty(obj: any): boolean {
        if(obj === null || obj === undefined) {
            return true;
        }
        if(Array.isArray(obj) || typeof(obj) === "string") {
            return obj.length === 0;
        }
        for(var key in obj) {
            if(obj.hasOwnProperty(key)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Check if object is NOT AN EMPTY string.
     * @param obj
     */

    export function isStr(obj: any): boolean {
        return typeof obj === "string";
    }

    /**
     * Check if obj is really an object
     * @param obj
     */

    export function isObj(obj: any): boolean {
        return obj === Object(obj);
    }

    /**
     * Check if object is a number
     * @param obj
     */

    export function isNum(obj: any): boolean {
        return !isNaN(parseFloat(obj)) && isFinite(obj);
    }

    /**
     * Create a random number between the minimum and the maximum parameter
     * @param [min]
     * @param [max]
     */

    export function randNum(min = 0, max = Math.pow(10, 16)): number {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    /**
     * Create a random word
     * @param [length]
     */

    export function randWord(length = 8): string {
        var word = "";
        for(;length > 0; length--) {
            if(Math.floor(length / 2) === (length / 2)) {
                word += "bcdfghjklmnpqrstvwxyz"[randNum(0, 20)];
            }
            else {
                word += "aeiou"[randNum(0, 4)];
            }
        }
        return word;
    }

    /**
     * Round up a number to the next integer
     * @param x
     */

    export function roundUp(x: number) {
        var f = Math.floor(x);
        if(f < x) {
            return f + 1;
        }
        return f;
    }

    /**
     * Generate an UUID
     */

    export function uuid(): string {
        var d = new Date().getTime();
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c === "x" ? r : (r & 0x7 | 0x8)).toString(16);
        });
    }

    /**
     * Extend an object
     * @param obj
     * @param source
     */

    export function extend(obj: Object, source: Object): Object {
        for(var key in source) {
            if(source.hasOwnProperty(key)) {
                obj[key] = source[key];
            }
        }
        return obj;
    }

    /**
     * Compare objects
     * @param source
     * @param target
     */

    export function hasProps(source: Object, target: Object): boolean {
        for(var key in source) {
            if(!source.hasOwnProperty(key) || !target.hasOwnProperty(key)) {
                return false;
            }
            if(isObj(source[key]) && isObj(target[key]) && hasProps(source[key], target[key])) {
                continue;
            }
            if(source[key] !== target[key]) {
                return false;
            }
        }
        return true;
    }

    /**
     * An empty function
     * @param [args]
     */

    export function noop(...args: any[]): void {

    }
}