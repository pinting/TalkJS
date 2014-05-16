/// <reference path="./definitions/wildemitter" />
/// <reference path="./definitions/mediastream" />
/// <reference path="./definitions/crypto" />

module Talk {
    declare var navigator: any;
    declare var window: any;

    export class Util {
        /**
         * Get rid of the browser prefixes
         */

        static PeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
        static SessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription;
        static IceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate;
        static MediaStream = window.MediaStream || window.webkitMediaStream;

        /**
         * Get user media
         */

        static getUserMedia(...args: any[]): void {
            (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia).apply(navigator, args);
        }

        /**
         * Attach stream to an element
         */

        static attachMediaStream(element: HTMLVideoElement, stream: MediaStream): HTMLVideoElement {
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

        static safeCb(obj: any): Function {
            if(typeof obj === "function") {
                return obj;
            }
            else {
                return this.noop;
            }
        }

        /**
         * Remove unwanted characters from a string
         */

        static safeStr(obj: any): string {
            return obj.replace(/\s/g, "-").replace(/[^A-Za-z0-9_\-]/g, "").toString();
        }

        /**
         * Make a string HTML-safe
         */

        static safeText(obj: any): string {
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

        static isEmpty(obj: any): boolean {
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

        static isString(obj: any): boolean {
            return typeof obj === "string" && !this.isEmpty(obj);
        }

        /**
         * Check input is object - from TokBox
         */

        static isObject(obj: any): boolean {
            return obj === Object(obj);
        }

        /**
         * Check if object is a number
         */

        static isNumber(obj: any): boolean {
            return !isNaN(parseFloat(obj)) && isFinite(obj);
        }

        /**
         * Create a random number between the minimum and the maximum argument
         */

        static randNum(min = 0, max = Math.pow(10, 16)): number {
            return Math.floor(Math.random() * (max - min + 1) + min);
        }

        /**
         * Create a random word
         */

        static randWord(length = 8): string {
            var word = "";
            for(;length > 0; length--) {
                if(Math.floor(length / 2) === (length / 2)) {
                    word += "bcdfghjklmnpqrstvwxyz"[this.randNum(0, 20)];
                }
                else {
                    word += "aeiou"[this.randNum(0, 4)];
                }
            }
            return word;
        }

        /**
         * Make an SHA256 hash from a string
         */

        static sha256(obj: string): string {
            return CryptoJS.SHA256(obj).toString();
        }

        /**
         * Check if an object can be found in a array
         */

        static find(list: any[], obj: any): boolean {
            return list.indexOf(obj) >= 0;
        }

        /**
         * Extend an array - from PeerJS
         */

        static extend(obj: Object, source: Object): Object {
            for(var key in source) {
                if(source.hasOwnProperty(key)) {
                    obj[key] = source[key];
                }
            }
            return obj;
        }

        /**
         * Overwrite an object EXISTING properties, with another object properties
         */

        static overwrite(obj: Object, source: Object): Object {
            for(var key in obj) {
                if(obj.hasOwnProperty(key) && source.hasOwnProperty(key)) {
                    obj[key] = source[key];
                }
            }
            return obj || {};
        }

        /**
         * Clone an object
         */

        static clone(obj: any): any {
            if(this.isObject(obj)) {
                if(Array.isArray(obj)) {
                    return obj.slice(0);
                }
                return this.extend({}, obj);
            }
            return obj;
        }

        /**
         * Compare objects by the first one
         */

        static comp(obj1: Object, obj2: Object): boolean {
            for(var key in obj1) {
                if(this.isObject(obj1[key]) && this.isObject(obj2[key]) && this.comp(obj1[key], obj2[key])) {
                    continue;
                }
                if(obj1[key] !== obj2[key]) {
                    return false;
                }
            }
            return true;
        }

        /**
         * Check what is supported - from PeerJS
         */

        static supports(config?: Object): Supports {
            if(!this.PeerConnection) {
                return <Supports> {};
            }

            var negotiation = !!window.webkitRTCPeerConnection;
            var media = true;
            var blob = false;
            var sctp = false;
            var data = true;
            var pc;
            var dc;

            config = config || {
                iceServers: [
                    {"url": "stun:stun.l.google.com:19302"}
                ]
            };

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

            return {
                negotiation: negotiation,
                media: media,
                blob: blob,
                sctp: sctp,
                data: data
            };
        }

        /**
         * An empty function
         */

        static noop(...args: any[]): void {

        }
    }

    export interface Supports {
        negotiation: boolean;
        media: boolean;
        blob: boolean;
        sctp: boolean;
        data: boolean;
    }
}