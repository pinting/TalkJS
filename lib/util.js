module.exports = {
    /**
     * Check if input is a function: if it is not, the return value will be an empty function
     * @cb {function}
     */

    safeCb: function(cb) {
        if(typeof cb === "function") {
            return cb;
        }
        else {
            return function() {};
        }
    },

    /**
     * Remove unwanted characters from a string (not for messages)
     * @string {string}
     */

    safeStr: function(string) {
        if(this.isString(string)) {
            return string.replace(/\s/g, "-").replace(/[^A-Za-z0-9_\-]/g, "").toString();
        }
        return "";
    },

    /**
     * Remove unwanted characters from a message
     * @string {string}
     */

    safeText: function(string) {
        if(this.isString(string)) {
            return string
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&apos;")
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
        }
        return "";
    },

    /**
     * Check if input is undefined or null, from TokBox
     * @obj {Object}
     */

    isNone: function(obj) {
        return obj === undefined || obj === null;
    },

    /**
     * Check if object is empty, from TokBox
     * @obj {object}
     */

    isEmpty: function(obj) {
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
    },

    /**
     * Check if object is a NOT EMPTY string.
     * @obj {string}
     */

    isString: function(obj) {
        return typeof obj === "string" && !this.isEmpty(obj);
    },

    /**
     * Check input is object, from TokBox
     * @obj {object}
     */

    isObject: function(obj) {
        return obj === Object(obj);
    },

    /**
     * Create a random number between the minimum and the maximum argument
     * @min {int}
     * @max {int}
     */

    randNum: function(min, max) {
        max = max || Math.pow(10, 16);
        min = min || 0;

        return Math.floor(Math.random() * (max - min + 1) + min);
    },

    /**
     * Create a random word
     * @length {int}
     */

    randWord: function(length) {
        var result = "";
        length = length || 8;

        for(;length > 0; length--) {
            if(Math.floor(length / 2) === length / 2) {
                result += "bcdfghjklmnpqrstvwxyz"[randNum(0, 20)];
            }
            else {
                result += "aeiou"[randNum(0, 4)];
            }
        }
        return result;
    },

    /**
     * Check if object is a number.
     * @obj {number}
     */

    isNumber: function(obj) {
        return !isNaN(parseFloat(obj)) && isFinite(obj);
    },

    /**
     * Check if object is a boolean.
     * @obj {boolean}
     */

    isBool: function(obj) {
        return typeof obj === "boolean";
    },

    /**
     * Make an SHA256 hash from a string
     * @string {string}
     */

    sha256: function(string) {
        if(this.isString(string)) {
            var hash = Crypto.createHash("sha256");
            hash.update(string);
            return hash.digest("hex");
        }
        return "";
    },

    /**
     * Check if an object can be found in a array
     * @array {array}
     * @obj {object}
     */

    find: function(array, obj) {
        return array.indexOf(obj) >= 0;
    },

    /**
     * Inherits an object, from PeerJS
     * @obj {object}
     * @parent {object}
     */

    inherits: function(obj, parent) {
        obj.prototype = Object.create(parent.prototype, {
            constructor: {
                configurable: true,
                enumerable: false,
                writable: true,
                value: obj
            }
        });
    }
};