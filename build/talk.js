!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.Talk=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var WildEmitter = _dereq_("wildemitter");
var Pointer = _dereq_("./pointer");

var Util = _dereq_("./util");
var Peer = _dereq_("./peer");

var Handler = (function (_super) {
    __extends(Handler, _super);
    function Handler(options) {
        _super.call(this);
        this.config = {
            configuration: {
                iceServers: [
                    { "url": "stun:stun.l.google.com:19302" },
                    { "url": "stun:stun1.l.google.com:19302" },
                    { "url": "stun:stun2.l.google.com:19302" },
                    { "url": "stun:stun3.l.google.com:19302" },
                    { "url": "stun:stun4.l.google.com:19302" }
                ]
            },
            options: {
                optional: [
                    { DtlsSrtpKeyAgreement: true },
                    { RtpDataChannels: true }
                ]
            },
            constraints: {
                mandatory: {
                    OfferToReceiveAudio: true,
                    OfferToReceiveVideo: true
                }
            },
            logger: {
                warn: Util.noop,
                log: Util.noop
            },
            stream: new Pointer
        };
        this.warn = Util.noop;
        this.log = Util.noop;
        this.peers = [];
        Util.overwrite(this.config, options);

        if (this.config.logger && this.config.logger.log && this.config.logger.warn) {
            this.warn = this.config.logger.warn.bind(this.config.logger);
            this.log = this.config.logger.log.bind(this.config.logger);
        }
    }
    Handler.prototype.add = function (P) {
        var _this = this;
        var peer = new (P || Peer)(this.config);
        peer.on("message", function (key, value) {
            _this.peers.forEach(function (p) {
                if (peer !== p) {
                    peer.get(key, JSON.stringify(value));
                }
            });
        });
        peer.on("*", function (type) {
            var args = [];
            for (var _i = 0; _i < (arguments.length - 1); _i++) {
                args[_i] = arguments[_i + 1];
            }
            _this.emit.apply(_this, [type, peer.id].concat(args));
        });
        this.log("Peer added:", peer);
        this.peers.push(peer);
        return peer;
    };

    Handler.prototype.get = function (args) {
        var result = this.peers.filter(function (peer) {
            for (var key in args) {
                if (args[key] !== peer[key]) {
                    return false;
                }
            }
            return true;
        });
        switch (result.length) {
            case 0:
                return false;
            case 1:
                return result[0];
            default:
                return result;
        }
    };
    return Handler;
})(WildEmitter);

module.exports = Handler;

},{"./peer":2,"./pointer":3,"./util":6,"wildemitter":7}],2:[function(_dereq_,module,exports){
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var WildEmitter = _dereq_("wildemitter");
var Pointer = _dereq_("./pointer");
var Shims = _dereq_("./shims");
var Util = _dereq_("./util");

var Peer = (function (_super) {
    __extends(Peer, _super);
    function Peer(options) {
        _super.call(this);
        this.config = {
            configuration: {
                iceServers: [
                    { "url": "stun:stun.l.google.com:19302" },
                    { "url": "stun:stun1.l.google.com:19302" },
                    { "url": "stun:stun2.l.google.com:19302" },
                    { "url": "stun:stun3.l.google.com:19302" },
                    { "url": "stun:stun4.l.google.com:19302" }
                ]
            },
            options: {
                optional: [
                    { DtlsSrtpKeyAgreement: true },
                    { RtpDataChannels: true }
                ]
            },
            constraints: {
                mandatory: {
                    OfferToReceiveAudio: true,
                    OfferToReceiveVideo: true
                }
            },
            logger: {
                warn: Util.noop,
                log: Util.noop
            },
            stream: new Pointer
        };
        this.id = Util.randNum();
        this.warn = Util.noop;
        this.log = Util.noop;
        this.channels = [];
        Util.overwrite(this.config, options);

        if (this.config.logger && this.config.logger.log && this.config.logger.warn) {
            this.warn = this.config.logger.warn.bind(this.config.logger);
            this.log = this.config.logger.log.bind(this.config.logger);
        }

        this.pc = new Shims.PeerConnection(this.config.configuration, this.config.options);
        this.pc.onnegotiationneeded = this.onNegotiationNeeded.bind(this);
        this.pc.oniceconnectionstatechange = this.onIceChange.bind(this);
        this.pc.ondatachannel = this.onDataChannel.bind(this);
        this.pc.onicecandidate = this.onCandidate.bind(this);
        this.pc.onicechange = this.onIceChange.bind(this);

        var stream = this.config.stream.get();
        if (stream) {
            this.log("Adding local stream to peer");
            this.pc.addStream(stream);
        }
    }
    Peer.prototype.send = function (key, value) {
        this.log("Sending:", key, value);
        this.emit("message", key, value);
    };

    Peer.prototype.get = function (key, value) {
        value = JSON.parse(value);
        this.log("Getting:", key, value);
        switch (key) {
            case "offer":
                this.answer(value);
                break;
            case "answer":
                this.handleAnswer(value);
                break;
            case "candidate":
                this.handleCandidate(value);
                break;
        }
    };

    Peer.prototype.onDataChannel = function (event) {
        if (event.channel) {
            this.channels.push(event.channel);
        }
    };

    Peer.prototype.onIceChange = function () {
        switch (this.pc.iceConnectionState) {
            case "disconnected":
            case "failed":
                this.warn("The iceConnectionState is disconnected, closing the peer:", this);
                this.pc.close();
                break;
            case "completed":
                this.pc.onicecandidate = Util.noop;
                break;
        }
    };

    Peer.prototype.onCandidate = function (event) {
        if (event.candidate) {
            this.log("Found candidate:", event.candidate);
            this.send("candidate", event.candidate);
            this.pc.onicecandidate = Util.noop;
        }
    };

    Peer.prototype.handleCandidate = function (ice) {
        if (ice.sdpMLineIndex && ice.candidate) {
            this.log("Handling received candidate:", ice);
            this.pc.addIceCandidate(new Shims.IceCandidate(ice));
        }
    };

    Peer.prototype.onNegotiationNeeded = function () {
        this.log("'negotiationneeded' triggered!");
        if (this.pc.signalingState === "stable") {
            this.offer();
        } else {
            this.warn("Signaling state is not stable!");
        }
    };

    Peer.prototype.offer = function () {
        var _this = this;
        this.log("Making an offer");
        this.pc.createOffer(function (offer) {
            _this.pc.setLocalDescription(offer, function () {
                _this.send("offer", offer);
            }, function (error) {
                _this.warn(error);
            });
        }, function (error) {
            _this.warn(error);
        }, this.config.constraints);
    };

    Peer.prototype.answer = function (offer) {
        var _this = this;
        this.log("Answering an offer");
        this.pc.setRemoteDescription(new Shims.SessionDescription(offer), function () {
            _this.pc.createAnswer(function (answer) {
                _this.pc.setLocalDescription(answer, function () {
                    _this.send("answer", answer);
                }, function (error) {
                    _this.warn(error);
                });
            }, function (error) {
                _this.warn(error);
            }, _this.config.constraints);
        }, function (error) {
            _this.warn(error);
        });
    };

    Peer.prototype.handleAnswer = function (answer) {
        var _this = this;
        this.pc.setRemoteDescription(new Shims.SessionDescription(answer), function () {
            _this.log("Answer handled successfully");
        }, function (error) {
            _this.warn(error);
        });
    };
    return Peer;
})(WildEmitter);

module.exports = Peer;

},{"./pointer":3,"./shims":4,"./util":6,"wildemitter":7}],3:[function(_dereq_,module,exports){
var Util = _dereq_("./util");

var Pointer = (function () {
    function Pointer(value) {
        this.storage = {
            value: null
        };
        if (!Util.isNone(value)) {
            this.storage.value = value;
        }
    }
    Pointer.prototype.set = function (value) {
        this.storage.value = value;
        return value;
    };

    Pointer.prototype.get = function () {
        return this.storage.value;
    };
    return Pointer;
})();

module.exports = Pointer;

},{"./util":6}],4:[function(_dereq_,module,exports){
var Shims = (function () {
    function Shims() {
    }
    Shims.getUserMedia = function () {
        var args = [];
        for (var _i = 0; _i < (arguments.length - 0); _i++) {
            args[_i] = arguments[_i + 0];
        }
        (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia).apply(navigator, args);
    };
    Shims.SessionDescription = window.RTCSessionDescription || window.webkitRTCSessionDescription || window.mozRTCSessionDescription;
    Shims.PeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
    Shims.IceCandidate = window.RTCIceCandidate || window.webkitRTCIceCandidate || window.mozRTCIceCandidate;
    return Shims;
})();

module.exports = Shims;

},{}],5:[function(_dereq_,module,exports){
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var WildEmitter = _dereq_("wildemitter");
var Handler = _dereq_("./handler");
var Pointer = _dereq_("./pointer");
var Shims = _dereq_("./shims");
var Peer = _dereq_("./peer");
var Util = _dereq_("./util");

var Talk = (function (_super) {
    __extends(Talk, _super);
    function Talk(options) {
        _super.call(this);
        this.localStream = new Pointer;
        this.config = {
            configuration: {
                iceServers: [
                    { "url": "stun:stun.l.google.com:19302" },
                    { "url": "stun:stun1.l.google.com:19302" },
                    { "url": "stun:stun2.l.google.com:19302" },
                    { "url": "stun:stun3.l.google.com:19302" },
                    { "url": "stun:stun4.l.google.com:19302" }
                ]
            },
            options: {
                optional: [
                    { DtlsSrtpKeyAgreement: true },
                    { RtpDataChannels: true }
                ]
            },
            constraints: {
                mandatory: {
                    OfferToReceiveAudio: true,
                    OfferToReceiveVideo: true
                }
            },
            logger: {
                warn: Util.noop,
                log: Util.noop
            },
            server: "http://localhost:8000",
            stream: this.localStream
        };
        this.warn = Util.noop;
        this.log = Util.noop;
        this.handlers = {};
        Util.overwrite(this.config, options);

        if (this.config.logger && this.config.logger.log && this.config.logger.warn) {
            this.warn = this.config.logger.warn.bind(this.config.logger);
            this.log = this.config.logger.log.bind(this.config.logger);
        }

        this.on("*", function () {
            var args = [];
            for (var _i = 0; _i < (arguments.length - 0); _i++) {
                args[_i] = arguments[_i + 0];
            }
            this.log.apply(this, ["Event: "].concat(args));
        });
    }
    Talk.prototype.create = function (id, H) {
        var _this = this;
        if (!this.handlers[id]) {
            var handler = new (H || Handler)(this.config);
            handler.on("*", function (type, peer) {
                var args = [];
                for (var _i = 0; _i < (arguments.length - 2); _i++) {
                    args[_i] = arguments[_i + 2];
                }
                _this.emit.apply(_this, [type, id, peer].concat(args));
            });
            this.handlers[id] = handler;
            return handler;
        }
        throw Error("Handler already exists!");
    };

    Talk.prototype.get = function (id) {
        if (this.handlers[id]) {
            return this.handlers[id];
        }
        return this.create(id);
    };

    Talk.prototype.getUserMedia = function (audio, video) {
        var _this = this;
        Shims.getUserMedia({
            audio: this.config.constraints.mandatory.OfferToReceiveAudio = audio,
            video: this.config.constraints.mandatory.OfferToReceiveVideo = video
        }, function (stream) {
            _this.localStream.set(stream);
            _this.emit("localStream", stream);
        }, function (error) {
            _this.warn(error);
            throw Error(error);
        });
        return this.localStream.get();
    };
    Talk.Pointer = Pointer;
    Talk.Handler = Handler;
    Talk.Util = Util;
    Talk.Peer = Peer;
    return Talk;
})(WildEmitter);

module.exports = Talk;

},{"./handler":1,"./peer":2,"./pointer":3,"./shims":4,"./util":6,"wildemitter":7}],6:[function(_dereq_,module,exports){

var Util = (function () {
    function Util() {
    }
    Util.safeCb = function (obj) {
        if (typeof obj === "function") {
            return obj;
        } else {
            return this.noop;
        }
    };

    Util.safeStr = function (obj) {
        if (this.isString(obj)) {
            return obj.replace(/\s/g, "-").replace(/[^A-Za-z0-9_\-]/g, "").toString();
        }
        return "";
    };

    Util.safeText = function (obj) {
        if (this.isString(obj)) {
            return obj.replace(/"/g, "&quot;").replace(/'/g, "&apos;").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        }
        return "";
    };

    Util.isNone = function (obj) {
        return obj === undefined || obj === null;
    };

    Util.isEmpty = function (obj) {
        if (obj === null || obj === undefined) {
            return true;
        }
        if (Array.isArray(obj) || typeof (obj) === "string") {
            return obj.length === 0;
        }
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                return false;
            }
        }
        return true;
    };

    Util.isString = function (obj) {
        return typeof obj === "string" && !this.isEmpty(obj);
    };

    Util.isObject = function (obj) {
        return obj === Object(obj);
    };

    Util.randNum = function (min, max) {
        max = max || Math.pow(10, 16);
        min = min || 0;

        return Math.floor(Math.random() * (max - min + 1) + min);
    };

    Util.randWord = function (length) {
        length = length || 8;
        var word = "";

        for (; length > 0; length--) {
            if (Math.floor(length / 2) === (length / 2)) {
                word += "bcdfghjklmnpqrstvwxyz"[this.randNum(0, 20)];
            } else {
                word += "aeiou"[this.randNum(0, 4)];
            }
        }
        return word;
    };

    Util.isNumber = function (obj) {
        return !isNaN(parseFloat(obj)) && isFinite(obj);
    };

    Util.isBool = function (obj) {
        return typeof obj === "boolean";
    };

    Util.sha256 = function (obj) {
        if (!this.isEmpty(obj)) {
            return CryptoJS.SHA256(obj).toString();
        }
        return "";
    };

    Util.find = function (list, obj) {
        return list.indexOf(obj) >= 0;
    };

    Util.extend = function (obj, source) {
        obj = obj || {};
        if (!this.isEmpty(source)) {
            for (var key in source) {
                if (source.hasOwnProperty(key)) {
                    obj[key] = source[key];
                }
            }
        }
        return obj;
    };

    Util.overwrite = function (obj, source) {
        if (!this.isEmpty(obj) && !this.isEmpty(source)) {
            for (var key in obj) {
                if (obj.hasOwnProperty(key) && source.hasOwnProperty(key)) {
                    obj[key] = source[key];
                }
            }
        }
        return obj || {};
    };

    Util.noop = function () {
        var args = [];
        for (var _i = 0; _i < (arguments.length - 0); _i++) {
            args[_i] = arguments[_i + 0];
        }
    };
    return Util;
})();

module.exports = Util;

},{}],7:[function(_dereq_,module,exports){
/*
WildEmitter.js is a slim little event emitter by @henrikjoreteg largely based 
on @visionmedia's Emitter from UI Kit.

Why? I wanted it standalone.

I also wanted support for wildcard emitters like this:

emitter.on('*', function (eventName, other, event, payloads) {
    
});

emitter.on('somenamespace*', function (eventName, payloads) {
    
});

Please note that callbacks triggered by wildcard registered events also get 
the event name as the first argument.
*/
module.exports = WildEmitter;

function WildEmitter() {
    this.callbacks = {};
}

// Listen on the given `event` with `fn`. Store a group name if present.
WildEmitter.prototype.on = function (event, groupName, fn) {
    var hasGroup = (arguments.length === 3),
        group = hasGroup ? arguments[1] : undefined,
        func = hasGroup ? arguments[2] : arguments[1];
    func._groupName = group;
    (this.callbacks[event] = this.callbacks[event] || []).push(func);
    return this;
};

// Adds an `event` listener that will be invoked a single
// time then automatically removed.
WildEmitter.prototype.once = function (event, groupName, fn) {
    var self = this,
        hasGroup = (arguments.length === 3),
        group = hasGroup ? arguments[1] : undefined,
        func = hasGroup ? arguments[2] : arguments[1];
    function on() {
        self.off(event, on);
        func.apply(this, arguments);
    }
    this.on(event, group, on);
    return this;
};

// Unbinds an entire group
WildEmitter.prototype.releaseGroup = function (groupName) {
    var item, i, len, handlers;
    for (item in this.callbacks) {
        handlers = this.callbacks[item];
        for (i = 0, len = handlers.length; i < len; i++) {
            if (handlers[i]._groupName === groupName) {
                //console.log('removing');
                // remove it and shorten the array we're looping through
                handlers.splice(i, 1);
                i--;
                len--;
            }
        }
    }
    return this;
};

// Remove the given callback for `event` or all
// registered callbacks.
WildEmitter.prototype.off = function (event, fn) {
    var callbacks = this.callbacks[event],
        i;

    if (!callbacks) return this;

    // remove all handlers
    if (arguments.length === 1) {
        delete this.callbacks[event];
        return this;
    }

    // remove specific handler
    i = callbacks.indexOf(fn);
    callbacks.splice(i, 1);
    return this;
};

/// Emit `event` with the given args.
// also calls any `*` handlers
WildEmitter.prototype.emit = function (event) {
    var args = [].slice.call(arguments, 1),
        callbacks = this.callbacks[event],
        specialCallbacks = this.getWildcardCallbacks(event),
        i,
        len,
        item,
        listeners;

    if (callbacks) {
        listeners = callbacks.slice();
        for (i = 0, len = listeners.length; i < len; ++i) {
            if (listeners[i]) {
                listeners[i].apply(this, args);
            } else {
                break;
            }
        }
    }

    if (specialCallbacks) {
        len = specialCallbacks.length;
        listeners = specialCallbacks.slice();
        for (i = 0, len = listeners.length; i < len; ++i) {
            if (listeners[i]) {
                listeners[i].apply(this, [event].concat(args));
            } else {
                break;
            }
        }
    }

    return this;
};

// Helper for for finding special wildcard event handlers that match the event
WildEmitter.prototype.getWildcardCallbacks = function (eventName) {
    var item,
        split,
        result = [];

    for (item in this.callbacks) {
        split = item.split('*');
        if (item === '*' || (split.length === 2 && eventName.slice(0, split[0].length) === split[0])) {
            result = result.concat(this.callbacks[item]);
        }
    }
    return result;
};

},{}]},{},[5])
(5)
});
/*
CryptoJS v3.1.2
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
/**
 * CryptoJS core components.
 */
var CryptoJS = CryptoJS || (function (Math, undefined) {
    /**
     * CryptoJS namespace.
     */
    var C = {};

    /**
     * Library namespace.
     */
    var C_lib = C.lib = {};

    /**
     * Base object for prototypal inheritance.
     */
    var Base = C_lib.Base = (function () {
        function F() {}

        return {
            /**
             * Creates a new object that inherits from this object.
             *
             * @param {Object} overrides Properties to copy into the new object.
             *
             * @return {Object} The new object.
             *
             * @static
             *
             * @example
             *
             *     var MyType = CryptoJS.lib.Base.extend({
             *         field: 'value',
             *
             *         method: function () {
             *         }
             *     });
             */
            extend: function (overrides) {
                // Spawn
                F.prototype = this;
                var subtype = new F();

                // Augment
                if (overrides) {
                    subtype.mixIn(overrides);
                }

                // Create default initializer
                if (!subtype.hasOwnProperty('init')) {
                    subtype.init = function () {
                        subtype.$super.init.apply(this, arguments);
                    };
                }

                // Initializer's prototype is the subtype object
                subtype.init.prototype = subtype;

                // Reference supertype
                subtype.$super = this;

                return subtype;
            },

            /**
             * Extends this object and runs the init method.
             * Arguments to create() will be passed to init().
             *
             * @return {Object} The new object.
             *
             * @static
             *
             * @example
             *
             *     var instance = MyType.create();
             */
            create: function () {
                var instance = this.extend();
                instance.init.apply(instance, arguments);

                return instance;
            },

            /**
             * Initializes a newly created object.
             * Override this method to add some logic when your objects are created.
             *
             * @example
             *
             *     var MyType = CryptoJS.lib.Base.extend({
             *         init: function () {
             *             // ...
             *         }
             *     });
             */
            init: function () {
            },

            /**
             * Copies properties into this object.
             *
             * @param {Object} properties The properties to mix in.
             *
             * @example
             *
             *     MyType.mixIn({
             *         field: 'value'
             *     });
             */
            mixIn: function (properties) {
                for (var propertyName in properties) {
                    if (properties.hasOwnProperty(propertyName)) {
                        this[propertyName] = properties[propertyName];
                    }
                }

                // IE won't copy toString using the loop above
                if (properties.hasOwnProperty('toString')) {
                    this.toString = properties.toString;
                }
            },

            /**
             * Creates a copy of this object.
             *
             * @return {Object} The clone.
             *
             * @example
             *
             *     var clone = instance.clone();
             */
            clone: function () {
                return this.init.prototype.extend(this);
            }
        };
    }());

    /**
     * An array of 32-bit words.
     *
     * @property {Array} words The array of 32-bit words.
     * @property {number} sigBytes The number of significant bytes in this word array.
     */
    var WordArray = C_lib.WordArray = Base.extend({
        /**
         * Initializes a newly created word array.
         *
         * @param {Array} words (Optional) An array of 32-bit words.
         * @param {number} sigBytes (Optional) The number of significant bytes in the words.
         *
         * @example
         *
         *     var wordArray = CryptoJS.lib.WordArray.create();
         *     var wordArray = CryptoJS.lib.WordArray.create([0x00010203, 0x04050607]);
         *     var wordArray = CryptoJS.lib.WordArray.create([0x00010203, 0x04050607], 6);
         */
        init: function (words, sigBytes) {
            words = this.words = words || [];

            if (sigBytes != undefined) {
                this.sigBytes = sigBytes;
            } else {
                this.sigBytes = words.length * 4;
            }
        },

        /**
         * Converts this word array to a string.
         *
         * @param {Encoder} encoder (Optional) The encoding strategy to use. Default: CryptoJS.enc.Hex
         *
         * @return {string} The stringified word array.
         *
         * @example
         *
         *     var string = wordArray + '';
         *     var string = wordArray.toString();
         *     var string = wordArray.toString(CryptoJS.enc.Utf8);
         */
        toString: function (encoder) {
            return (encoder || Hex).stringify(this);
        },

        /**
         * Concatenates a word array to this word array.
         *
         * @param {WordArray} wordArray The word array to append.
         *
         * @return {WordArray} This word array.
         *
         * @example
         *
         *     wordArray1.concat(wordArray2);
         */
        concat: function (wordArray) {
            // Shortcuts
            var thisWords = this.words;
            var thatWords = wordArray.words;
            var thisSigBytes = this.sigBytes;
            var thatSigBytes = wordArray.sigBytes;

            // Clamp excess bits
            this.clamp();

            // Concat
            if (thisSigBytes % 4) {
                // Copy one byte at a time
                for (var i = 0; i < thatSigBytes; i++) {
                    var thatByte = (thatWords[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
                    thisWords[(thisSigBytes + i) >>> 2] |= thatByte << (24 - ((thisSigBytes + i) % 4) * 8);
                }
            } else if (thatWords.length > 0xffff) {
                // Copy one word at a time
                for (var i = 0; i < thatSigBytes; i += 4) {
                    thisWords[(thisSigBytes + i) >>> 2] = thatWords[i >>> 2];
                }
            } else {
                // Copy all words at once
                thisWords.push.apply(thisWords, thatWords);
            }
            this.sigBytes += thatSigBytes;

            // Chainable
            return this;
        },

        /**
         * Removes insignificant bits.
         *
         * @example
         *
         *     wordArray.clamp();
         */
        clamp: function () {
            // Shortcuts
            var words = this.words;
            var sigBytes = this.sigBytes;

            // Clamp
            words[sigBytes >>> 2] &= 0xffffffff << (32 - (sigBytes % 4) * 8);
            words.length = Math.ceil(sigBytes / 4);
        },

        /**
         * Creates a copy of this word array.
         *
         * @return {WordArray} The clone.
         *
         * @example
         *
         *     var clone = wordArray.clone();
         */
        clone: function () {
            var clone = Base.clone.call(this);
            clone.words = this.words.slice(0);

            return clone;
        },

        /**
         * Creates a word array filled with random bytes.
         *
         * @param {number} nBytes The number of random bytes to generate.
         *
         * @return {WordArray} The random word array.
         *
         * @static
         *
         * @example
         *
         *     var wordArray = CryptoJS.lib.WordArray.random(16);
         */
        random: function (nBytes) {
            var words = [];
            for (var i = 0; i < nBytes; i += 4) {
                words.push((Math.random() * 0x100000000) | 0);
            }

            return new WordArray.init(words, nBytes);
        }
    });

    /**
     * Encoder namespace.
     */
    var C_enc = C.enc = {};

    /**
     * Hex encoding strategy.
     */
    var Hex = C_enc.Hex = {
        /**
         * Converts a word array to a hex string.
         *
         * @param {WordArray} wordArray The word array.
         *
         * @return {string} The hex string.
         *
         * @static
         *
         * @example
         *
         *     var hexString = CryptoJS.enc.Hex.stringify(wordArray);
         */
        stringify: function (wordArray) {
            // Shortcuts
            var words = wordArray.words;
            var sigBytes = wordArray.sigBytes;

            // Convert
            var hexChars = [];
            for (var i = 0; i < sigBytes; i++) {
                var bite = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
                hexChars.push((bite >>> 4).toString(16));
                hexChars.push((bite & 0x0f).toString(16));
            }

            return hexChars.join('');
        },

        /**
         * Converts a hex string to a word array.
         *
         * @param {string} hexStr The hex string.
         *
         * @return {WordArray} The word array.
         *
         * @static
         *
         * @example
         *
         *     var wordArray = CryptoJS.enc.Hex.parse(hexString);
         */
        parse: function (hexStr) {
            // Shortcut
            var hexStrLength = hexStr.length;

            // Convert
            var words = [];
            for (var i = 0; i < hexStrLength; i += 2) {
                words[i >>> 3] |= parseInt(hexStr.substr(i, 2), 16) << (24 - (i % 8) * 4);
            }

            return new WordArray.init(words, hexStrLength / 2);
        }
    };

    /**
     * Latin1 encoding strategy.
     */
    var Latin1 = C_enc.Latin1 = {
        /**
         * Converts a word array to a Latin1 string.
         *
         * @param {WordArray} wordArray The word array.
         *
         * @return {string} The Latin1 string.
         *
         * @static
         *
         * @example
         *
         *     var latin1String = CryptoJS.enc.Latin1.stringify(wordArray);
         */
        stringify: function (wordArray) {
            // Shortcuts
            var words = wordArray.words;
            var sigBytes = wordArray.sigBytes;

            // Convert
            var latin1Chars = [];
            for (var i = 0; i < sigBytes; i++) {
                var bite = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
                latin1Chars.push(String.fromCharCode(bite));
            }

            return latin1Chars.join('');
        },

        /**
         * Converts a Latin1 string to a word array.
         *
         * @param {string} latin1Str The Latin1 string.
         *
         * @return {WordArray} The word array.
         *
         * @static
         *
         * @example
         *
         *     var wordArray = CryptoJS.enc.Latin1.parse(latin1String);
         */
        parse: function (latin1Str) {
            // Shortcut
            var latin1StrLength = latin1Str.length;

            // Convert
            var words = [];
            for (var i = 0; i < latin1StrLength; i++) {
                words[i >>> 2] |= (latin1Str.charCodeAt(i) & 0xff) << (24 - (i % 4) * 8);
            }

            return new WordArray.init(words, latin1StrLength);
        }
    };

    /**
     * UTF-8 encoding strategy.
     */
    var Utf8 = C_enc.Utf8 = {
        /**
         * Converts a word array to a UTF-8 string.
         *
         * @param {WordArray} wordArray The word array.
         *
         * @return {string} The UTF-8 string.
         *
         * @static
         *
         * @example
         *
         *     var utf8String = CryptoJS.enc.Utf8.stringify(wordArray);
         */
        stringify: function (wordArray) {
            try {
                return decodeURIComponent(escape(Latin1.stringify(wordArray)));
            } catch (e) {
                throw new Error('Malformed UTF-8 data');
            }
        },

        /**
         * Converts a UTF-8 string to a word array.
         *
         * @param {string} utf8Str The UTF-8 string.
         *
         * @return {WordArray} The word array.
         *
         * @static
         *
         * @example
         *
         *     var wordArray = CryptoJS.enc.Utf8.parse(utf8String);
         */
        parse: function (utf8Str) {
            return Latin1.parse(unescape(encodeURIComponent(utf8Str)));
        }
    };

    /**
     * Abstract buffered block algorithm template.
     *
     * The property blockSize must be implemented in a concrete subtype.
     *
     * @property {number} _minBufferSize The number of blocks that should be kept unprocessed in the buffer. Default: 0
     */
    var BufferedBlockAlgorithm = C_lib.BufferedBlockAlgorithm = Base.extend({
        /**
         * Resets this block algorithm's data buffer to its initial state.
         *
         * @example
         *
         *     bufferedBlockAlgorithm.reset();
         */
        reset: function () {
            // Initial values
            this._data = new WordArray.init();
            this._nDataBytes = 0;
        },

        /**
         * Adds new data to this block algorithm's buffer.
         *
         * @param {WordArray|string} data The data to append. Strings are converted to a WordArray using UTF-8.
         *
         * @example
         *
         *     bufferedBlockAlgorithm._append('data');
         *     bufferedBlockAlgorithm._append(wordArray);
         */
        _append: function (data) {
            // Convert string to WordArray, else assume WordArray already
            if (typeof data == 'string') {
                data = Utf8.parse(data);
            }

            // Append
            this._data.concat(data);
            this._nDataBytes += data.sigBytes;
        },

        /**
         * Processes available data blocks.
         *
         * This method invokes _doProcessBlock(offset), which must be implemented by a concrete subtype.
         *
         * @param {boolean} doFlush Whether all blocks and partial blocks should be processed.
         *
         * @return {WordArray} The processed data.
         *
         * @example
         *
         *     var processedData = bufferedBlockAlgorithm._process();
         *     var processedData = bufferedBlockAlgorithm._process(!!'flush');
         */
        _process: function (doFlush) {
            // Shortcuts
            var data = this._data;
            var dataWords = data.words;
            var dataSigBytes = data.sigBytes;
            var blockSize = this.blockSize;
            var blockSizeBytes = blockSize * 4;

            // Count blocks ready
            var nBlocksReady = dataSigBytes / blockSizeBytes;
            if (doFlush) {
                // Round up to include partial blocks
                nBlocksReady = Math.ceil(nBlocksReady);
            } else {
                // Round down to include only full blocks,
                // less the number of blocks that must remain in the buffer
                nBlocksReady = Math.max((nBlocksReady | 0) - this._minBufferSize, 0);
            }

            // Count words ready
            var nWordsReady = nBlocksReady * blockSize;

            // Count bytes ready
            var nBytesReady = Math.min(nWordsReady * 4, dataSigBytes);

            // Process blocks
            if (nWordsReady) {
                for (var offset = 0; offset < nWordsReady; offset += blockSize) {
                    // Perform concrete-algorithm logic
                    this._doProcessBlock(dataWords, offset);
                }

                // Remove processed words
                var processedWords = dataWords.splice(0, nWordsReady);
                data.sigBytes -= nBytesReady;
            }

            // Return processed words
            return new WordArray.init(processedWords, nBytesReady);
        },

        /**
         * Creates a copy of this object.
         *
         * @return {Object} The clone.
         *
         * @example
         *
         *     var clone = bufferedBlockAlgorithm.clone();
         */
        clone: function () {
            var clone = Base.clone.call(this);
            clone._data = this._data.clone();

            return clone;
        },

        _minBufferSize: 0
    });

    /**
     * Abstract hasher template.
     *
     * @property {number} blockSize The number of 32-bit words this hasher operates on. Default: 16 (512 bits)
     */
    var Hasher = C_lib.Hasher = BufferedBlockAlgorithm.extend({
        /**
         * Configuration options.
         */
        cfg: Base.extend(),

        /**
         * Initializes a newly created hasher.
         *
         * @param {Object} cfg (Optional) The configuration options to use for this hash computation.
         *
         * @example
         *
         *     var hasher = CryptoJS.algo.SHA256.create();
         */
        init: function (cfg) {
            // Apply config defaults
            this.cfg = this.cfg.extend(cfg);

            // Set initial values
            this.reset();
        },

        /**
         * Resets this hasher to its initial state.
         *
         * @example
         *
         *     hasher.reset();
         */
        reset: function () {
            // Reset data buffer
            BufferedBlockAlgorithm.reset.call(this);

            // Perform concrete-hasher logic
            this._doReset();
        },

        /**
         * Updates this hasher with a message.
         *
         * @param {WordArray|string} messageUpdate The message to append.
         *
         * @return {Hasher} This hasher.
         *
         * @example
         *
         *     hasher.update('message');
         *     hasher.update(wordArray);
         */
        update: function (messageUpdate) {
            // Append
            this._append(messageUpdate);

            // Update the hash
            this._process();

            // Chainable
            return this;
        },

        /**
         * Finalizes the hash computation.
         * Note that the finalize operation is effectively a destructive, read-once operation.
         *
         * @param {WordArray|string} messageUpdate (Optional) A final message update.
         *
         * @return {WordArray} The hash.
         *
         * @example
         *
         *     var hash = hasher.finalize();
         *     var hash = hasher.finalize('message');
         *     var hash = hasher.finalize(wordArray);
         */
        finalize: function (messageUpdate) {
            // Final message update
            if (messageUpdate) {
                this._append(messageUpdate);
            }

            // Perform concrete-hasher logic
            var hash = this._doFinalize();

            return hash;
        },

        blockSize: 512/32,

        /**
         * Creates a shortcut function to a hasher's object interface.
         *
         * @param {Hasher} hasher The hasher to create a helper for.
         *
         * @return {Function} The shortcut function.
         *
         * @static
         *
         * @example
         *
         *     var SHA256 = CryptoJS.lib.Hasher._createHelper(CryptoJS.algo.SHA256);
         */
        _createHelper: function (hasher) {
            return function (message, cfg) {
                return new hasher.init(cfg).finalize(message);
            };
        },

        /**
         * Creates a shortcut function to the HMAC's object interface.
         *
         * @param {Hasher} hasher The hasher to use in this HMAC helper.
         *
         * @return {Function} The shortcut function.
         *
         * @static
         *
         * @example
         *
         *     var HmacSHA256 = CryptoJS.lib.Hasher._createHmacHelper(CryptoJS.algo.SHA256);
         */
        _createHmacHelper: function (hasher) {
            return function (message, key) {
                return new C_algo.HMAC.init(hasher, key).finalize(message);
            };
        }
    });

    /**
     * Algorithm namespace.
     */
    var C_algo = C.algo = {};

    return C;
}(Math));

/*
CryptoJS v3.1.2
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
(function (Math) {
    // Shortcuts
    var C = CryptoJS;
    var C_lib = C.lib;
    var WordArray = C_lib.WordArray;
    var Hasher = C_lib.Hasher;
    var C_algo = C.algo;

    // Initialization and round constants tables
    var H = [];
    var K = [];

    // Compute constants
    (function () {
        function isPrime(n) {
            var sqrtN = Math.sqrt(n);
            for (var factor = 2; factor <= sqrtN; factor++) {
                if (!(n % factor)) {
                    return false;
                }
            }

            return true;
        }

        function getFractionalBits(n) {
            return ((n - (n | 0)) * 0x100000000) | 0;
        }

        var n = 2;
        var nPrime = 0;
        while (nPrime < 64) {
            if (isPrime(n)) {
                if (nPrime < 8) {
                    H[nPrime] = getFractionalBits(Math.pow(n, 1 / 2));
                }
                K[nPrime] = getFractionalBits(Math.pow(n, 1 / 3));

                nPrime++;
            }

            n++;
        }
    }());

    // Reusable object
    var W = [];

    /**
     * SHA-256 hash algorithm.
     */
    var SHA256 = C_algo.SHA256 = Hasher.extend({
        _doReset: function () {
            this._hash = new WordArray.init(H.slice(0));
        },

        _doProcessBlock: function (M, offset) {
            // Shortcut
            var H = this._hash.words;

            // Working variables
            var a = H[0];
            var b = H[1];
            var c = H[2];
            var d = H[3];
            var e = H[4];
            var f = H[5];
            var g = H[6];
            var h = H[7];

            // Computation
            for (var i = 0; i < 64; i++) {
                if (i < 16) {
                    W[i] = M[offset + i] | 0;
                } else {
                    var gamma0x = W[i - 15];
                    var gamma0  = ((gamma0x << 25) | (gamma0x >>> 7))  ^
                                  ((gamma0x << 14) | (gamma0x >>> 18)) ^
                                   (gamma0x >>> 3);

                    var gamma1x = W[i - 2];
                    var gamma1  = ((gamma1x << 15) | (gamma1x >>> 17)) ^
                                  ((gamma1x << 13) | (gamma1x >>> 19)) ^
                                   (gamma1x >>> 10);

                    W[i] = gamma0 + W[i - 7] + gamma1 + W[i - 16];
                }

                var ch  = (e & f) ^ (~e & g);
                var maj = (a & b) ^ (a & c) ^ (b & c);

                var sigma0 = ((a << 30) | (a >>> 2)) ^ ((a << 19) | (a >>> 13)) ^ ((a << 10) | (a >>> 22));
                var sigma1 = ((e << 26) | (e >>> 6)) ^ ((e << 21) | (e >>> 11)) ^ ((e << 7)  | (e >>> 25));

                var t1 = h + sigma1 + ch + K[i] + W[i];
                var t2 = sigma0 + maj;

                h = g;
                g = f;
                f = e;
                e = (d + t1) | 0;
                d = c;
                c = b;
                b = a;
                a = (t1 + t2) | 0;
            }

            // Intermediate hash value
            H[0] = (H[0] + a) | 0;
            H[1] = (H[1] + b) | 0;
            H[2] = (H[2] + c) | 0;
            H[3] = (H[3] + d) | 0;
            H[4] = (H[4] + e) | 0;
            H[5] = (H[5] + f) | 0;
            H[6] = (H[6] + g) | 0;
            H[7] = (H[7] + h) | 0;
        },

        _doFinalize: function () {
            // Shortcuts
            var data = this._data;
            var dataWords = data.words;

            var nBitsTotal = this._nDataBytes * 8;
            var nBitsLeft = data.sigBytes * 8;

            // Add padding
            dataWords[nBitsLeft >>> 5] |= 0x80 << (24 - nBitsLeft % 32);
            dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 14] = Math.floor(nBitsTotal / 0x100000000);
            dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 15] = nBitsTotal;
            data.sigBytes = dataWords.length * 4;

            // Hash final blocks
            this._process();

            // Return final computed hash
            return this._hash;
        },

        clone: function () {
            var clone = Hasher.clone.call(this);
            clone._hash = this._hash.clone();

            return clone;
        }
    });

    /**
     * Shortcut function to the hasher's object interface.
     *
     * @param {WordArray|string} message The message to hash.
     *
     * @return {WordArray} The hash.
     *
     * @static
     *
     * @example
     *
     *     var hash = CryptoJS.SHA256('message');
     *     var hash = CryptoJS.SHA256(wordArray);
     */
    C.SHA256 = Hasher._createHelper(SHA256);

    /**
     * Shortcut function to the HMAC's object interface.
     *
     * @param {WordArray|string} message The message to hash.
     * @param {WordArray|string} key The secret key.
     *
     * @return {WordArray} The HMAC.
     *
     * @static
     *
     * @example
     *
     *     var hmac = CryptoJS.HmacSHA256(message, key);
     */
    C.HmacSHA256 = Hasher._createHmacHelper(SHA256);
}(Math));
