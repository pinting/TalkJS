/// <reference path="./definitions/rtcpeerconnection" />
/// <reference path="./definitions/wildemitter" />
/// <reference path="./definitions/crypto" />

module Talk {
    declare var navigator: any;
    declare var window: any;

    export interface Message {
        handler: any[];
        peer: string;
        key: string;
        value: any;
    }

    export interface Supports {
        negotiation: boolean;
        media: boolean;
        blob: boolean;
        sctp: boolean;
        data: boolean;
    }

    export interface Logger {
        warn: (...args: any[]) => void;
        log: (...args: any[]) => void;
    }

    /**
     * Polyfills for the browsers
     */

    export var PeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
    export var SessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription;
    export var IceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate;
    export var MediaStream = window.MediaStream || window.webkitMediaStream;

    /**
     * Logger functions
     */

    export var log = noop;
    export var warn = noop;

    /**
     * Local MediaStream
     */

    export var userMedia: any;

    /**
     * Check what is supported - from PeerJS
     */

    export var supports = <Supports> (function(config?: Object): Supports {
        if(!this.PeerConnection) {
            return <Supports> {};
        }

        config = config || {
            iceServers: [
                {"url": "stun:stun.l.google.com:19302"}
            ]
        };

        var negotiation = !!window.webkitRTCPeerConnection;
        var media = true;
        var blob = false;
        var sctp = false;
        var data = true;
        var pc;
        var dc;

        try {
            pc = new this.PeerConnection(config, {optional: [{RtpDataChannels: true}]});
        }
        catch(e) {
            data = false;
            media = false;
        }

        if(data) {
            try {
                dc = pc.createDataChannel("_test");
            }
            catch(e) {
                data = false;
            }
        }

        if(data) {
            try {
                dc.binaryType = "blob";
                blob = true;
            }
            catch(e) {

            }

            var reliablePC = new this.PeerConnection(config, {});
            try {
                var reliableDC = reliablePC.createDataChannel("_reliableTest", <RTCDataChannelInit> {});
                sctp = reliableDC.reliable;
            }
            catch(e) {

            }
            reliablePC.close();
        }

        if(media) {
            media = !!pc.addStream;
        }

        if(!negotiation && data) {
            var negotiationPC = new this.PeerConnection(config, {optional: [{RtpDataChannels: true}]});
            negotiationPC.onnegotiationneeded = function() {
                negotiation = true;
            };
            negotiationPC.createDataChannel("_negotiationTest");

            setTimeout(function() {
                negotiationPC.close();
            }, 1000);
        }

        if(pc) {
            pc.close();
        }

        return <Supports> {
            negotiation: negotiation,
            media: media,
            blob: blob,
            sctp: sctp,
            data: data
        };
    })();

    /**
     * Set a new logger
     */

    export function logger(obj: Logger): void {
        if(obj.log) {
            log = obj.log.bind(obj);
        }
        if(obj.warn) {
            warn = obj.warn.bind(warn);
        }
    }

    /**
     * Get user media
     */

    export function getUserMedia(audio = true, video = true, cb?: (stream: MediaStream) => void): MediaStream {
        if(!userMedia || userMedia.ended) {
            (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia)(
                {
                    audio: audio,
                    video: video
                },
                (stream: MediaStream) => {
                    log("User media request was successful");
                    userMedia = stream;
                    safeCb(cb)(stream);
                },
                (error: string) => {
                    warn(error);
                    throw Error(error);
                }
            );
        }
        return userMedia;
    }

    /**
     * Attach stream to an element
     */

    export function attachMediaStream(element: HTMLVideoElement, stream: MediaStream): HTMLVideoElement {
        if(window.URL) {
            element.src = window.URL.createObjectURL(stream);
        }
        else {
            element.src = <any> stream;
        }
        element.autoplay = true;
        return element;
    }

    /**
     * Check if input is a function: if it is not, then return an empty function
     */

    export function safeCb(obj: any): any {
        if(typeof obj === "function") {
            return obj;
        }
        else {
            return noop;
        }
    }

    /**
     * Remove unwanted characters from a string
     */

    export function safeStr(obj: any): string {
        return obj.replace(/\s/g, "-").replace(/[^A-Za-z0-9_\-]/g, "").toString();
    }

    /**
     * Make a string HTML-safe
     */

    export function safeText(obj: any): string {
        return obj
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&apos;")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }

    /**
     * Check if object is empty - from TokBox
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
     * Check if object is a NOT EMPTY string.
     */

    export function isStr(obj: any): boolean {
        return typeof obj === "string" && !isEmpty(obj);
    }

    /**
     * Check input is object - from TokBox
     */

    export function isObj(obj: any): boolean {
        return obj === Object(obj);
    }

    /**
     * Check if object is a number
     */

    export function isNum(obj: any): boolean {
        return !isNaN(parseFloat(obj)) && isFinite(obj);
    }

    /**
     * Create a random number between the minimum and the maximum argument
     */

    export function randNum(min = 0, max = Math.pow(10, 16)): number {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    /**
     * Create a random word
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
     * Make an SHA256 hash from a string
     */

    export function sha256(obj: string): string {
        return CryptoJS.SHA256(obj).toString();
    }

    /**
     * Check if an object can be found in a array
     */

    export function find(list: any[], obj: any): boolean {
        return list.indexOf(obj) >= 0;
    }

    /**
     * Extend an array - from PeerJS
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
     * Clone an object
     */

    export function clone(obj: any): any {
        if(isObj(obj)) {
            if(Array.isArray(obj)) {
                return obj.slice(0);
            }
            return extend({}, obj);
        }
        return obj;
    }

    /**
     * Compare objects by the first one
     */

    export function comp(obj1: Object, obj2: Object): boolean {
        for(var key in obj1) {
            if(isObj(obj1[key]) && isObj(obj2[key]) && comp(obj1[key], obj2[key])) {
                continue;
            }
            if(obj1[key] !== obj2[key]) {
                return false;
            }
        }
        return true;
    }

    /**
     * An empty function
     */

    export function noop(...args: any[]): void {

    }
}