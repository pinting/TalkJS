/**
 * Check if input is a function: if it is not, the return value will be an empty function
 * @cb {function}
 */

function safeCb(cb) {
    if(typeof cb === "function") {
        return cb;
    }
    else {
        return function() {};
    }
}

/**
 * Remove unwanted characters from a string (not for messages)
 * @string {string}
 */

function safeStr(string) {
    if(typeof string === "string") {
        return string.replace(/\s/g, "-").replace(/[^A-Za-z0-9_\-]/g, "").toString();
    }
    return "";
}

/**
 * Remove unwanted characters from a message
 * @string {string}
 */

function safeText(string) {
    if(typeof string === "string") {
        return string.replace(/[<>\/\\\{\}]/g, "").toString();
    }
    return "";
}

/**
 * Create a random number between the minimum and the maximum argument
 * @min {int}
 * @max {int}
 */

function randNum(min, max) {
    max = max || Math.pow(10, 16);
    min = min || 0;

    return Math.floor(Math.random() * (max - min + 1) + min);
}

/**
 * Create a random word
 * @length {int}
 */

function randWord(length) {
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
}

/**
 * Check if object is empty, from TokBox
 * @obj {object}
 */

function isEmpty(obj) {
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
 * Check if input is undefined or null, from TokBox
 * @obj {object}
 */

function isNone(obj) {
    return obj === undefined || obj === null;
}

/**
 * Check input is object, from TokBox
 * @obj {object}
 */

function isObject(obj) {
    return obj === Object(obj);
}

/**
 * Check if object is a number.
 * @obj {number}
 */

function isNumber(obj) {
    return !isNaN(parseFloat(obj)) && isFinite(obj);
}

/**
 * Check if object is a boolean.
 * @obj {boolean}
 */

function isBool(obj) {
    return typeof obj === "boolean";
}

/**
 * Check if object is a NOT EMPTY string.
 * @obj {string}
 */

function isString(obj) {
    return typeof obj === "string" && !isEmpty(obj);
}

/**
 * Make an SHA256 hash from a string
 * @string {string}
 */

function sha256(string) {
    if(!isEmpty(string)) {
        return CryptoJS.SHA256(string).toString();
    }
    return "";
}