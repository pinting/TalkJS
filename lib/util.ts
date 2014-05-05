/// <reference path="./definitions/rtcpeerConnection.d.ts" />
/// <reference path="./definitions/crypto.d.ts" />

interface WebRTCWindow extends Window {
    webkitRTCPeerConnection: RTCPeerConnection;
    mozRTCPeerConnection: RTCPeerConnection;
}

declare var window: WebRTCWindow;

class Util {
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
        if(this.isString(obj)) {
            return obj.replace(/\s/g, "-").replace(/[^A-Za-z0-9_\-]/g, "").toString();
        }
        return "";
    }

    /**
     * Make a string HTML-safe
     */

    static safeText(obj: any): string {
        if(this.isString(obj)) {
            return obj
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&apos;")
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
        }
        return "";
    }

    /**
     * Check if input is undefined or null - from TokBox
     */

    static isNone(obj: any): boolean {
        return obj === undefined || obj === null;
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
     * Create a random number between the minimum and the maximum argument
     */

    static randNum(min?: number, max?: number): number {
        max = max || Math.pow(10, 16);
        min = min || 0;

        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    /**
     * Create a random word
     */

    static randWord(length?: number): string {
        length = length || 8;
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
     * Check if object is a number.
     */

    static isNumber(obj: any): boolean {
        return !isNaN(parseFloat(obj)) && isFinite(obj);
    }

    /**
     * Check if object is a boolean.
     */

    static isBool(obj: any): boolean {
        return typeof obj === "boolean";
    }

    /**
     * Make an SHA256 hash from a string
     */

    static sha256(obj: string): string {
        if(!this.isEmpty(obj)) {
            return CryptoJS.SHA256(obj).toString();
        }
        return "";
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
        obj = obj || {};
        if(!this.isEmpty(source)) {
            for(var key in source) {
                if(source.hasOwnProperty(key)) {
                    obj[key] = source[key];
                }
            }
        }
        return obj;
    }

    /**
     * Overwrite an object EXISTING properties, with another object properties
     */

    static overwrite(obj: Object, source: Object): Object {
        if(!this.isEmpty(obj) && !this.isEmpty(source)) {
            for(var key in obj) {
                if(obj.hasOwnProperty(key) && source.hasOwnProperty(key)) {
                    obj[key] = source[key];
                }
            }
        }
        return obj || {};
    }

    /**
     * Clone an object
     */

    static clone(obj) {
        if (this.isObject(obj)) {
            if(Array.isArray(obj)) {
                return obj.slice(0);
            }
            return this.extend({}, obj);
        }
        return obj;
    }

    /**
     * An empty function
     */

    static noop(...args: any[]) {

    }
}

export = Util;