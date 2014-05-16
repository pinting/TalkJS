var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Talk;
(function (Talk) {
    var Connection = (function (_super) {
        __extends(Connection, _super);
        function Connection(handler, host) {
            if (typeof host === "undefined") { host = "http://localhost:8000"; }
            var _this = this;
            _super.call(this);

            this.warn = handler.warn.bind(handler);
            this.log = handler.log.bind(handler);

            this.handler = handler;
            this.handler.on("message", this.send.bind(this));
            this.server = io.connect(host);
            this.server.on("connect", function () {
                _this.id = _this.server.socket.sessionid;
                _this.emit("connectionReady", _this.id);
            });
            this.server.on("message", this.get.bind(this));
        }
        Connection.prototype.send = function (payload) {
            this.log("Sending:", payload);
            this.server.emit("message", payload);
        };

        Connection.prototype.get = function (payload) {
            this.log("Getting:", payload);
            if (payload.key && payload.value && payload.peer && payload.handler) {
                var peer = this.findHandler(payload.handler).get(payload.peer);
                if (peer) {
                    this.log("Peer found!");
                    peer.parseMessage(payload.key, payload.value);
                } else {
                    this.warn("Peer not found!");
                }
            }
        };

        Connection.prototype.findHandler = function (handler) {
            var dest = this.handler;
            handler.forEach(function (id) {
                dest = dest.h(id);
            });
            return dest;
        };
        return Connection;
    })(WildEmitter);
    Talk.Connection = Connection;
})(Talk || (Talk = {}));
var Talk;
(function (Talk) {
    var Handler = (function (_super) {
        __extends(Handler, _super);
        function Handler(id, options) {
            var _this = this;
            _super.call(this);
            this.config = {
                media: {
                    mandatory: {
                        OfferToReceiveAudio: false,
                        OfferToReceiveVideo: false
                    }
                },
                logger: {
                    warn: Talk.Util.noop,
                    log: Talk.Util.noop
                },
                localStream: new Talk.Pointer,
                handler: Handler,
                supports: null,
                peer: Talk.Peer
            };
            this.handlers = [];
            this._peers = [];

            if (!options && !Talk.Util.isString(id)) {
                options = id;
                id = null;
            }
            Talk.Util.extend(this.config, options);

            this.config.supports = this.config.supports || Talk.Util.supports();
            this.warn = this.config.logger.warn.bind(this.config.logger);
            this.log = this.config.logger.log.bind(this.config.logger);
            this.id = id;

            this.config.localStream.on("change", function (stream) {
                _this.localStream = stream;
            });
        }
        Handler.prototype.getUserMedia = function (audio, video) {
            var _this = this;
            if (typeof audio === "undefined") { audio = true; }
            if (typeof video === "undefined") { video = true; }
            if (!this.localStream || this.localStream.ended) {
                Talk.Util.getUserMedia({
                    audio: this.config.media.mandatory.OfferToReceiveAudio = audio,
                    video: this.config.media.mandatory.OfferToReceiveVideo = video
                }, function (stream) {
                    _this.log("User media request was successful");
                    _this.config.localStream.value = stream;
                    _this.emit("localStream", stream);
                }, function (error) {
                    _this.warn(error);
                    throw Error(error);
                });
            }
            return this.localStream;
        };

        Handler.prototype.createHandler = function (id, H) {
            var _this = this;
            this.config.handler = H || this.config.handler;
            var handler = new this.config.handler(id, this.config);
            handler.on("*", function () {
                var args = [];
                for (var _i = 0; _i < (arguments.length - 0); _i++) {
                    args[_i] = arguments[_i + 0];
                }
                switch (args[0]) {
                    case "message":
                        var payload = args[1];
                        payload = Talk.Util.clone(payload);
                        payload.handler = [handler.id].concat(payload.handler);
                        _this.emit("message", payload);
                        break;
                    default:
                        _this.emit.apply(_this, args);
                        break;
                }
            });
            this.log("Handler created:", handler);
            this.handlers.push(handler);
            return handler;
        };

        Handler.prototype.h = function (id, H) {
            var result = false;
            this.handlers.some(function (handler) {
                if (handler.id === id) {
                    result = handler;
                    return true;
                }
                return false;
            });
            if (!result) {
                result = this.createHandler(id, H);
            }
            return result;
        };

        Handler.prototype.add = function (id) {
            var _this = this;
            var peer = new this.config.peer(id, this.config);
            peer.on("*", function () {
                var args = [];
                for (var _i = 0; _i < (arguments.length - 0); _i++) {
                    args[_i] = arguments[_i + 0];
                }
                switch (args[0]) {
                    case "peerClosed":
                        var i = _this._peers.indexOf(peer);
                        if (i >= 0) {
                            _this._peers.splice(i, 1);
                        }
                    default:
                        _this.emit.apply(_this, args);
                        break;
                }
            });
            this.log("Peer added:", peer);
            this._peers.push(peer);
            return peer;
        };

        Handler.prototype.get = function (id) {
            var result = false;
            this._peers.some(function (peer) {
                if (peer.id === id) {
                    result = peer;
                    return true;
                }
                return false;
            });
            return result;
        };

        Handler.prototype.peers = function (args, cb) {
            var result;
            if (Talk.Util.isObject(args)) {
                result = this._peers.filter(function (peer) {
                    return Talk.Util.comp(args, peer);
                });
            } else {
                result = this._peers;
                cb = args;
            }
            switch (typeof cb) {
                case "function":
                    result.forEach(cb);
                    break;
                case "string":
                    result.forEach(function (peer) {
                        peer[cb]();
                    });
            }
            return result;
        };
        return Handler;
    })(WildEmitter);
    Talk.Handler = Handler;
})(Talk || (Talk = {}));
var Talk;
(function (Talk) {
    var Peer = (function (_super) {
        __extends(Peer, _super);
        function Peer(id, options) {
            _super.call(this);
            this.config = {
                options: {
                    iceServers: [
                        { "url": "stun:stun.l.google.com:19302" },
                        { "url": "stun:stun1.l.google.com:19302" },
                        { "url": "stun:stun2.l.google.com:19302" },
                        { "url": "stun:stun3.l.google.com:19302" },
                        { "url": "stun:stun4.l.google.com:19302" }
                    ]
                },
                media: {
                    mandatory: {
                        OfferToReceiveAudio: false,
                        OfferToReceiveVideo: false
                    }
                },
                logger: {
                    warn: Talk.Util.noop,
                    log: Talk.Util.noop
                },
                supports: null,
                negotiate: false
            };
            this.channels = [];
            Talk.Util.overwrite(this.config, options);

            this.warn = this.config.logger.warn.bind(this.config.logger);
            this.log = this.config.logger.log.bind(this.config.logger);
            this.supports = this.config.supports || Talk.Util.supports();
            this.id = id;

            this.pc = new Talk.Util.PeerConnection(this.config.options, {
                optional: [
                    { RtpDataChannels: !this.supports.sctp },
                    { DtlsSrtpKeyAgreement: true }
                ]
            });
            this.pc.oniceconnectionstatechange = this.onConnectionChange.bind(this);
            this.pc.onicechange = this.onConnectionChange.bind(this);
            this.pc.onnegotiationneeded = this.negotiate.bind(this);
            this.pc.onremovestream = this.onRemoveStream.bind(this);
            this.pc.ondatachannel = this.onDataChannel.bind(this);
            this.pc.onicecandidate = this.onCandidate.bind(this);
            this.pc.onaddstream = this.onAddStream.bind(this);
        }
        Peer.prototype.sendMessage = function (key, value) {
            var payload = {
                peer: this.id,
                value: value,
                handler: [],
                key: key
            };
            this.emit("message", payload);
        };

        Peer.prototype.parseMessage = function (key, value) {
            this.log("Parsing:", key, value);
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
                default:
                    return false;
            }
            return true;
        };

        Peer.prototype.addStream = function (stream) {
            this.localStream = new Talk.Util.MediaStream(stream);
            this.pc.addStream(this.localStream, this.config.media);
            this.log("Stream was added:", this.localStream);
            if (!this.supports.negotiation) {
                this.negotiate();
            }
        };

        Peer.prototype.onAddStream = function (event) {
            if (event.stream) {
                this.log("Remote stream was added:", event.stream);
                this.remoteStream = event.stream;
                this.emit("streamAdded", this);
            } else {
                this.warn("Remote stream could not be added:", event);
            }
        };

        Peer.prototype.onRemoveStream = function (event) {
            this.remoteStream = {};
            this.emit("streamRemoved", this);
            this.log("Remote stream was removed from peer:", event);
        };

        Peer.prototype.send = function (label, payload) {
            var channel = this.getDataChannel(label);
            if (channel && channel.readyState === "open") {
                channel.send(JSON.stringify(payload));
                return true;
            }
            this.warn("Data channel named `%s` does not exists or it is not opened", label);
            return false;
        };

        Peer.prototype.getDataChannel = function (label) {
            var result = false;
            this.channels.some(function (channel) {
                if (channel.label === label) {
                    result = channel;
                    return true;
                }
                return false;
            });
            return result;
        };

        Peer.prototype.configDataChannel = function (channel) {
            var _this = this;
            channel.onclose = function (event) {
                _this.log("Channel named `%s` was closed", channel.label);
                _this.emit("channelClosed", _this, event);
            };
            channel.onerror = function (event) {
                _this.warn("Channel error:", event);
                _this.emit("channelError", _this, event);
            };
            channel.onopen = function (event) {
                _this.log("Channel named `%s` was opened", channel.label);
                _this.emit("channelOpened", _this, event);
            };
            channel.onmessage = function (event) {
                if (event.data) {
                    var payload = JSON.parse(event.data);
                    _this.log("Getting (%s):", channel.label, payload);
                    _this.emit("channelMessage", _this, payload);
                }
            };
        };

        Peer.prototype.addDataChannel = function (label, options) {
            var channel = this.pc.createDataChannel(label, options);
            this.configDataChannel(channel);
            this.channels.push(channel);
            this.log("Data channel was added:", channel);
            if (!this.supports.negotiation) {
                this.negotiate();
            }
            return channel;
        };

        Peer.prototype.onDataChannel = function (event) {
            if (event.channel) {
                this.configDataChannel(event.channel);
                this.channels.push(event.channel);
                this.log("Data channel was added:", event.channel);
            } else {
                this.warn("Data channel could not be added", event);
            }
        };

        Peer.prototype.onConnectionChange = function () {
            this.log("Ice connection state was changed to `%s`", this.pc.iceConnectionState);
            switch (this.pc.iceConnectionState) {
                case "disconnected":
                case "failed":
                    this.close();
                    break;
                case "completed":
                case "closed":
                    this.pc.onicecandidate = Talk.Util.noop;
                    break;
                default:
                    this.pc.onicecandidate = this.onCandidate.bind(this);
                    break;
            }
        };

        Peer.prototype.onCandidate = function (event) {
            if (event.candidate) {
                this.log("Candidate was found:", event.candidate);
                this.sendMessage("candidate", event.candidate);
                this.pc.onicecandidate = Talk.Util.noop;
            } else {
                this.log("End of candidates", event);
            }
        };

        Peer.prototype.handleCandidate = function (ice) {
            if (ice.candidate && ice.sdpMid && Talk.Util.isNumber(ice.sdpMLineIndex)) {
                this.log("Handling received candidate:", ice);
                this.pc.addIceCandidate(new Talk.Util.IceCandidate(ice));
            } else {
                this.warn("Candidate could not be handled:", ice);
            }
        };

        Peer.prototype.negotiate = function () {
            this.log("Negotiation is needed");
            if (this.config.negotiate) {
                if (this.pc.signalingState === "stable") {
                    this.offer();
                } else {
                    this.warn("Signaling state is not stable");
                }
            }
        };

        Peer.prototype.offer = function () {
            var _this = this;
            this.log("Creating an offer");
            this.pc.createOffer(function (offer) {
                _this.pc.setLocalDescription(offer, function () {
                    _this.sendMessage("offer", offer);
                    _this.log("Offer created:", offer);
                }, function (error) {
                    _this.warn(error);
                });
            }, function (error) {
                _this.warn(error);
            }, this.config.media);
        };

        Peer.prototype.answer = function (offer) {
            var _this = this;
            this.log("Answering for an offer:", offer);
            this.pc.setRemoteDescription(new Talk.Util.SessionDescription(offer), function () {
                _this.pc.createAnswer(function (answer) {
                    _this.pc.setLocalDescription(answer, function () {
                        _this.sendMessage("answer", answer);
                    }, function (error) {
                        _this.warn(error);
                    });
                }, function (error) {
                    _this.warn(error);
                }, _this.config.media);
            }, function (error) {
                _this.warn(error);
            });
        };

        Peer.prototype.handleAnswer = function (answer) {
            var _this = this;
            this.log("Handling an answer:", answer);
            this.pc.setRemoteDescription(new Talk.Util.SessionDescription(answer), function () {
                _this.log("Answer was handled successfully");
            }, function (error) {
                _this.warn(error);
            });
        };

        Peer.prototype.close = function () {
            this.pc.close();
            this.emit("peerClosed", this);
            this.log("Peer closed:", this);
        };

        Peer.prototype.mute = function () {
            this.remoteStream.getAudioTracks().forEach(function (track) {
                track.enabled = false;
            });
            this.log("Peer audio was muted:", this);
        };

        Peer.prototype.unmute = function () {
            this.remoteStream.getAudioTracks().forEach(function (track) {
                track.enabled = true;
            });
            this.log("Peer audio was unmuted:", this);
        };

        Peer.prototype.pause = function () {
            this.remoteStream.getVideoTracks().forEach(function (track) {
                track.enabled = false;
            });
            this.log("Peer video was paused:", this);
        };

        Peer.prototype.resume = function () {
            this.remoteStream.getVideoTracks().forEach(function (track) {
                track.enabled = true;
            });
            this.log("Peer video was resumed:", this);
        };

        Peer.prototype.muteLocal = function () {
            this.localStream.getAudioTracks().forEach(function (track) {
                track.enabled = false;
            });
            this.log("Local audio for the peer was muted:", this);
        };

        Peer.prototype.unmuteLocal = function () {
            this.localStream.getAudioTracks().forEach(function (track) {
                track.enabled = true;
            });
            this.log("Local audio for the peer was unmuted:", this);
        };

        Peer.prototype.pauseLocal = function () {
            this.localStream.getVideoTracks().forEach(function (track) {
                track.enabled = false;
            });
            this.log("Local video for the peer was paused:", this);
        };

        Peer.prototype.resumeLocal = function () {
            this.localStream.getVideoTracks().forEach(function (track) {
                track.enabled = true;
            });
            this.log("Local video for the peer was resumed:", this);
        };
        return Peer;
    })(WildEmitter);
    Talk.Peer = Peer;
})(Talk || (Talk = {}));
var Talk;
(function (Talk) {
    var Pointer = (function (_super) {
        __extends(Pointer, _super);
        function Pointer(value) {
            _super.call(this);
            this.memory = {
                value: null
            };
            this.memory.value = value || null;
        }
        Object.defineProperty(Pointer.prototype, "value", {
            get: function () {
                return this.memory.value;
            },
            set: function (value) {
                this.memory.value = value;
                this.emit("change", value);
            },
            enumerable: true,
            configurable: true
        });

        return Pointer;
    })(WildEmitter);
    Talk.Pointer = Pointer;
})(Talk || (Talk = {}));
var Talk;
(function (Talk) {
    var Room = (function (_super) {
        __extends(Room, _super);
        function Room(handler, host, onOffer, onAnswer) {
            if (typeof host === "undefined") { host = "http://localhost:8000"; }
            if (typeof onOffer === "undefined") { onOffer = Talk.Util.noop; }
            _super.call(this, handler, host);

            if (!onAnswer) {
                this.onAnswer = onOffer;
            } else {
                this.onAnswer = onAnswer;
            }
            this.onOffer = onOffer;
            this.server.on("remove", this.remove.bind(this));
        }
        Room.prototype.get = function (payload) {
            this.log("Getting:", payload);
            if (payload.key && payload.value && payload.peer) {
                var peer = this.handler.get(payload.peer);
                if (!peer && payload.key === "offer") {
                    peer = this.handler.add(payload.peer);
                    this.onAnswer(peer);
                }
                if (peer) {
                    this.log("Peer found!");
                    peer.parseMessage(payload.key, payload.value);
                } else {
                    this.warn("Peer not found!");
                }
            }
        };

        Room.prototype.join = function (room, type, cb) {
            var _this = this;
            this.server.emit("join", room, type, function (error, clients) {
                _this.log("Joined to room `%s`", room);
                if (error) {
                    _this.warn(error);
                }
                clients.forEach(function (client) {
                    var peer = _this.handler.add(client.id);
                    _this.onOffer(peer);
                    peer.offer();
                });
                _this.room = room;
                _this.type = type;
                Talk.Util.safeCb(cb)(error, clients);
            });
        };

        Room.prototype.leave = function () {
            this.log("Room `%s` was left", this.room);
            this.server.emit("leave");
            this.handler.peers("close");
            this.room = null;
            this.type = null;
        };

        Room.prototype.remove = function (id) {
            this.log("Removing a peer:", id);
            var peer = this.handler.get(id);
            if (peer) {
                peer.close();
                return true;
            }
            return false;
        };
        return Room;
    })(Talk.Connection);
    Talk.Room = Room;
})(Talk || (Talk = {}));
var Talk;
(function (Talk) {
    var Util = (function () {
        function Util() {
        }
        Util.getUserMedia = function () {
            var args = [];
            for (var _i = 0; _i < (arguments.length - 0); _i++) {
                args[_i] = arguments[_i + 0];
            }
            (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia).apply(navigator, args);
        };

        Util.attachMediaStream = function (element, stream) {
            if (window.URL) {
                element.src = window.URL.createObjectURL(stream);
            } else {
                element.src = stream;
            }
            element.autoplay = true;
            return element;
        };

        Util.safeCb = function (obj) {
            if (typeof obj === "function") {
                return obj;
            } else {
                return this.noop;
            }
        };

        Util.safeStr = function (obj) {
            return obj.replace(/\s/g, "-").replace(/[^A-Za-z0-9_\-]/g, "").toString();
        };

        Util.safeText = function (obj) {
            return obj.replace(/"/g, "&quot;").replace(/'/g, "&apos;").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
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

        Util.isNumber = function (obj) {
            return !isNaN(parseFloat(obj)) && isFinite(obj);
        };

        Util.randNum = function (min, max) {
            if (typeof min === "undefined") { min = 0; }
            if (typeof max === "undefined") { max = Math.pow(10, 16); }
            return Math.floor(Math.random() * (max - min + 1) + min);
        };

        Util.randWord = function (length) {
            if (typeof length === "undefined") { length = 8; }
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

        Util.sha256 = function (obj) {
            return CryptoJS.SHA256(obj).toString();
        };

        Util.find = function (list, obj) {
            return list.indexOf(obj) >= 0;
        };

        Util.extend = function (obj, source) {
            for (var key in source) {
                if (source.hasOwnProperty(key)) {
                    obj[key] = source[key];
                }
            }
            return obj;
        };

        Util.overwrite = function (obj, source) {
            for (var key in obj) {
                if (obj.hasOwnProperty(key) && source.hasOwnProperty(key)) {
                    obj[key] = source[key];
                }
            }
            return obj || {};
        };

        Util.clone = function (obj) {
            if (this.isObject(obj)) {
                if (Array.isArray(obj)) {
                    return obj.slice(0);
                }
                return this.extend({}, obj);
            }
            return obj;
        };

        Util.comp = function (obj1, obj2) {
            for (var key in obj1) {
                if (this.isObject(obj1[key]) && this.isObject(obj2[key]) && this.comp(obj1[key], obj2[key])) {
                    continue;
                }
                if (obj1[key] !== obj2[key]) {
                    return false;
                }
            }
            return true;
        };

        Util.supports = function (config) {
            if (!this.PeerConnection) {
                return {};
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
                    { "url": "stun:stun.l.google.com:19302" }
                ]
            };

            try  {
                pc = new this.PeerConnection(config, { optional: [{ RtpDataChannels: true }] });
            } catch (e) {
                data = false;
                media = false;
            }

            if (data) {
                try  {
                    dc = pc.createDataChannel("_test");
                } catch (e) {
                    data = false;
                }
            }

            if (data) {
                try  {
                    dc.binaryType = "blob";
                    blob = true;
                } catch (e) {
                }

                var reliablePC = new this.PeerConnection(config, {});
                try  {
                    var reliableDC = reliablePC.createDataChannel("_reliableTest", {});
                    sctp = reliableDC.reliable;
                } catch (e) {
                }
                reliablePC.close();
            }

            if (media) {
                media = !!pc.addStream;
            }

            if (!negotiation && data) {
                var negotiationPC = new this.PeerConnection(config, { optional: [{ RtpDataChannels: true }] });
                negotiationPC.onnegotiationneeded = function () {
                    negotiation = true;
                };
                negotiationPC.createDataChannel("_negotiationTest");

                setTimeout(function () {
                    negotiationPC.close();
                }, 1000);
            }

            if (pc) {
                pc.close();
            }

            return {
                negotiation: negotiation,
                media: media,
                blob: blob,
                sctp: sctp,
                data: data
            };
        };

        Util.noop = function () {
            var args = [];
            for (var _i = 0; _i < (arguments.length - 0); _i++) {
                args[_i] = arguments[_i + 0];
            }
        };
        Util.PeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
        Util.SessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription;
        Util.IceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate;
        Util.MediaStream = window.MediaStream || window.webkitMediaStream;
        return Util;
    })();
    Talk.Util = Util;
})(Talk || (Talk = {}));
