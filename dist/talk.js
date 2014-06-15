var WildEmitter = require("wildemitter");
var io = require("socket.io-client");
var CryptoJS = require("crypto-js");

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
            if (typeof host === "undefined") { host = "http://srv.talk.pinting.hu:8000"; }
            var _this = this;
            _super.call(this);

            this.handler = handler;
            this.handler.on("message", this.send.bind(this));
            this.server = io.connect(host);
            this.server.on("connect", function () {
                _this.id = _this.server.socket.sessionid;
                _this.emit("ready", _this.id);
                Talk.log("Connection is ready:", _this.id);
            });
            this.server.on("message", this.get.bind(this));
        }
        Connection.prototype.send = function (payload) {
            this.server.emit("message", payload);
        };

        Connection.prototype.get = function (payload) {
            if (payload.key && payload.value && payload.peer && payload.handler) {
                var peer = this.findHandler(payload.handler).get(payload.peer);
                if (peer) {
                    peer.parseMessage(payload.key, payload.value);
                } else {
                    Talk.warn("Peer not found!");
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
            _super.call(this);
            this.handlers = [];
            this.config = {};
            this.peers = [];

            if (!options && !Talk.isStr(id)) {
                options = id;
                id = null;
            }
            Talk.extend(this.config, options);
            this.id = id;
        }
        Handler.prototype.createHandler = function (id, H) {
            var _this = this;
            if (typeof H === "undefined") { H = Handler; }
            var handler = new H(id, this.config);
            handler.on("*", function () {
                var args = [];
                for (var _i = 0; _i < (arguments.length - 0); _i++) {
                    args[_i] = arguments[_i + 0];
                }
                switch (args[0]) {
                    case "message":
                        var payload = args[1];
                        payload = Talk.clone(payload);
                        payload.handler = [handler.id].concat(payload.handler);
                        _this.emit("message", payload);
                        break;
                    default:
                        _this.emit.apply(_this, args);
                        break;
                }
            });
            Talk.log("Handler created:", handler);
            this.handlers.push(handler);
            return handler;
        };

        Handler.prototype.h = function (id, H) {
            if (typeof H === "undefined") { H = Handler; }
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

        Handler.prototype.add = function (id, P) {
            var _this = this;
            if (typeof P === "undefined") { P = Talk.Peer; }
            var peer = new P(id, this.config);
            peer.on("*", function () {
                var args = [];
                for (var _i = 0; _i < (arguments.length - 0); _i++) {
                    args[_i] = arguments[_i + 0];
                }
                switch (args[0]) {
                    case "closed":
                        var i = _this.peers.indexOf(peer);
                        if (i >= 0) {
                            _this.peers.splice(i, 1);
                        }
                    default:
                        _this.emit.apply(_this, args);
                        break;
                }
            });
            Talk.log("Peer added:", peer);
            this.peers.push(peer);
            return peer;
        };

        Handler.prototype.get = function (id) {
            var result = false;
            this.peers.some(function (peer) {
                if (peer.id === id) {
                    result = peer;
                    return true;
                }
                return false;
            });
            return result;
        };

        Handler.prototype.find = function (props, cb) {
            var result;
            if (Talk.isObj(props) && !Talk.isFunc(props)) {
                result = this.peers.filter(function (peer) {
                    return Talk.comp(props, peer);
                });
            } else {
                result = this.peers;
                cb = props;
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
    Talk.PeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
    Talk.SessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription;
    Talk.IceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate;
    Talk.MediaStream = window.MediaStream || window.webkitMediaStream;

    Talk.userMedia;

    Talk.debug = noop;
    Talk.warn = noop;
    Talk.log = noop;

    Talk.sctp = (function () {
        var pc = new Talk.PeerConnection({
            iceServers: [
                { "url": "stun:stun.l.google.com:19302" }
            ]
        }, {});
        try  {
            var dc = pc.createDataChannel("_test", {});
            pc.close();
            return dc.reliable || false;
        } catch (e) {
            pc.close();
            return false;
        }
    })();

    Talk.negotiations = (function () {
        var pc = new Talk.PeerConnection({
            iceServers: [
                { "url": "stun:stun.l.google.com:19302" }
            ]
        }, {
            optional: [
                { RtpDataChannels: true }
            ]
        });
        pc.onnegotiationneeded = function () {
            Talk.negotiations = true;
        };
        pc.createDataChannel("_test");

        setTimeout(function () {
            pc.close();
        }, 1000);

        return false;
    })();

    function logger(obj) {
        if (obj.warn) {
            Talk.warn = obj.warn.bind(obj);
        }
        if (obj.log) {
            Talk.log = obj.log.bind(obj);
        }
    }
    Talk.logger = logger;

    function getUserMedia(audio, video, cb) {
        if (typeof audio === "undefined") { audio = true; }
        if (typeof video === "undefined") { video = true; }
        if (!Talk.userMedia || Talk.userMedia.ended) {
            navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
            navigator.getUserMedia({
                audio: audio,
                video: video
            }, function (stream) {
                Talk.log("User media request was successful");
                Talk.userMedia = stream;
                safeCb(cb)(null, stream);
            }, function (error) {
                Talk.warn(error);
                safeCb(cb)(error);
            });
        } else {
            return Talk.userMedia;
        }
    }
    Talk.getUserMedia = getUserMedia;

    function attachMediaStream(element, stream) {
        if (URL) {
            element.src = URL.createObjectURL(stream);
        } else {
            element.src = stream;
        }
        element.autoplay = true;
        return element;
    }
    Talk.attachMediaStream = attachMediaStream;

    function dataURLtoBlob(dataURL) {
        var type = dataURL.split(";")[0].split(":")[1];
        var data = atob(dataURL.split(",")[1]);
        var buffer = new Uint8Array(data.length);

        for (var i = 0; i < data.length; i++) {
            buffer[i] = data.charCodeAt(i);
        }

        return new Blob([buffer], { type: type });
    }
    Talk.dataURLtoBlob = dataURLtoBlob;

    function safeCb(obj) {
        if (typeof obj === "function") {
            return obj;
        } else {
            return noop;
        }
    }
    Talk.safeCb = safeCb;

    function safeStr(obj) {
        return obj.replace(/\s/g, "-").replace(/[^A-Za-z0-9_\-]/g, "").toString();
    }
    Talk.safeStr = safeStr;

    function safeText(obj) {
        return obj.replace(/"/g, "&quot;").replace(/'/g, "&apos;").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
    Talk.safeText = safeText;

    function isFunc(obj) {
        return typeof obj === "function";
    }
    Talk.isFunc = isFunc;

    function isEmpty(obj) {
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
    }
    Talk.isEmpty = isEmpty;

    function isStr(obj) {
        return typeof obj === "string";
    }
    Talk.isStr = isStr;

    function isObj(obj) {
        return obj === Object(obj);
    }
    Talk.isObj = isObj;

    function isNum(obj) {
        return !isNaN(parseFloat(obj)) && isFinite(obj);
    }
    Talk.isNum = isNum;

    function randNum(min, max) {
        if (typeof min === "undefined") { min = 0; }
        if (typeof max === "undefined") { max = Math.pow(10, 16); }
        return Math.floor(Math.random() * (max - min + 1) + min);
    }
    Talk.randNum = randNum;

    function randWord(length) {
        if (typeof length === "undefined") { length = 8; }
        var word = "";
        for (; length > 0; length--) {
            if (Math.floor(length / 2) === (length / 2)) {
                word += "bcdfghjklmnpqrstvwxyz"[randNum(0, 20)];
            } else {
                word += "aeiou"[randNum(0, 4)];
            }
        }
        return word;
    }
    Talk.randWord = randWord;

    function md5(obj) {
        return CryptoJS.MD5(obj).toString();
    }
    Talk.md5 = md5;

    function find(list, obj) {
        return list.indexOf(obj) >= 0;
    }
    Talk.find = find;

    function extend(obj, source) {
        for (var key in source) {
            if (source.hasOwnProperty(key)) {
                obj[key] = source[key];
            }
        }
        return obj;
    }
    Talk.extend = extend;

    function clone(obj) {
        if (isObj(obj)) {
            if (Array.isArray(obj)) {
                return obj.slice(0);
            }
            return extend({}, obj);
        }
        return obj;
    }
    Talk.clone = clone;

    function comp(obj1, obj2) {
        for (var key in obj1) {
            if (isObj(obj1[key]) && isObj(obj2[key]) && comp(obj1[key], obj2[key])) {
                continue;
            }
            if (obj1[key] !== obj2[key]) {
                return false;
            }
        }
        return true;
    }
    Talk.comp = comp;

    function noop() {
        var args = [];
        for (var _i = 0; _i < (arguments.length - 0); _i++) {
            args[_i] = arguments[_i + 0];
        }
    }
    Talk.noop = noop;
})(Talk || (Talk = {}));
var Talk;
(function (Talk) {
    var Peer = (function (_super) {
        __extends(Peer, _super);
        function Peer(id, options) {
            _super.call(this);
            this.config = {
                settings: {
                    iceServers: [
                        { "url": "stun:stun.l.google.com:19302" },
                        { "url": "stun:stun1.l.google.com:19302" },
                        { "url": "stun:stun2.l.google.com:19302" },
                        { "url": "stun:stun3.l.google.com:19302" },
                        { "url": "stun:stun4.l.google.com:19302" }
                    ]
                },
                constraints: {
                    optional: [
                        { DtlsSrtpKeyAgreement: true },
                        { RtpDataChannels: !Talk.sctp }
                    ]
                },
                media: {
                    mandatory: {
                        OfferToReceiveAudio: false,
                        OfferToReceiveVideo: false
                    }
                },
                serverDataChannel: true,
                newMediaStream: false,
                negotiate: false,
                chunkSize: 1024
            };
            this.channels = [];
            this.chunks = {};

            Talk.extend(this.config, options);
            this.id = id;

            this.pc = new Talk.PeerConnection(this.config.settings, this.config.constraints);
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
                case "packet":
                    this.handlePacket(value, null);
                    break;
                case "packetsEnd":
                    this.endOfPackets.apply(this, value);
                    break;
                case "packetsReceived":
                    this.deleteChunks(value);
                    break;
                case "packetReq":
                    this.sendPacket.apply(this, value);
                    break;
                default:
                    return false;
            }
            return true;
        };

        Peer.prototype.onConnectionChange = function () {
            Talk.log("Ice connection state was changed to `%s`", this.pc.iceConnectionState);
            switch (this.pc.iceConnectionState) {
                case "disconnected":
                case "failed":
                    this.close();
                    break;
                case "completed":
                case "closed":
                    this.pc.onicecandidate = Talk.noop;
                    break;
                default:
                    this.pc.onicecandidate = this.onCandidate.bind(this);
                    break;
            }
            this.emit("connectionState", this, this.pc.iceConnectionState);
        };

        Peer.prototype.onCandidate = function (event) {
            if (event.candidate) {
                Talk.log("Candidate was found:", event.candidate);
                this.sendMessage("candidate", event.candidate);
            } else {
                Talk.log("End of candidates", event);
            }
        };

        Peer.prototype.handleCandidate = function (ice) {
            if (Talk.isStr(ice.candidate) && Talk.isStr(ice.sdpMid) && Talk.isNum(ice.sdpMLineIndex)) {
                Talk.log("Handling received candidate:", ice);
                this.pc.addIceCandidate(new Talk.IceCandidate(ice));
            } else {
                Talk.warn("Candidate could not be handled:", ice);
            }
        };

        Peer.prototype.negotiate = function () {
            Talk.log("Negotiation is needed");
            if (this.config.negotiate) {
                if (this.pc.signalingState === "stable") {
                    this.offer();
                } else {
                    Talk.warn("Signaling state is not stable");
                }
            }
        };

        Peer.prototype.offer = function () {
            var _this = this;
            Talk.log("Creating an offer");
            this.pc.createOffer(function (offer) {
                _this.pc.setLocalDescription(offer, function () {
                    _this.sendMessage("offer", offer);
                    Talk.log("Offer created:", offer);
                }, function (error) {
                    Talk.warn(error);
                });
            }, function (error) {
                Talk.warn(error);
            }, this.config.media);
        };

        Peer.prototype.answer = function (offer) {
            var _this = this;
            Talk.log("Answering for an offer:", offer);
            this.pc.setRemoteDescription(new Talk.SessionDescription(offer), function () {
                _this.pc.createAnswer(function (answer) {
                    _this.pc.setLocalDescription(answer, function () {
                        _this.sendMessage("answer", answer);
                    }, function (error) {
                        Talk.warn(error);
                    });
                }, function (error) {
                    Talk.warn(error);
                }, _this.config.media);
            }, function (error) {
                Talk.warn(error);
            });
        };

        Peer.prototype.handleAnswer = function (answer) {
            Talk.log("Handling an answer:", answer);
            this.pc.setRemoteDescription(new Talk.SessionDescription(answer), function () {
                Talk.log("Answer was handled successfully");
            }, function (error) {
                Talk.warn(error);
            });
        };

        Peer.prototype.close = function () {
            this.pc.close();
            this.emit("closed", this);
            Talk.log("Peer closed:", this);
        };

        Peer.prototype.sendData = function (payload, label) {
            var _this = this;
            payload = JSON.stringify(payload);

            var n = (function () {
                var x = payload.length / _this.config.chunkSize;
                var f = Math.floor(x);

                if (f < x) {
                    return f + 1;
                }
                return f;
            })();
            var id = Talk.md5(payload);
            var c = 0;

            if (!this.chunks[id]) {
                this.chunks[id] = {};
            }

            var interval = setInterval(function () {
                if (c <= n) {
                    var start = _this.config.chunkSize * c;
                    var chunk = payload.slice(start, start + _this.config.chunkSize);
                    try  {
                        _this.chunks[id][c + 1] = chunk;
                        _this.emit("packetSent", _this, _this.sendPacket(id, ++c, n, label), payload.length);
                    } catch (error) {
                        Talk.warn(error);
                    }
                } else {
                    clearInterval(interval);
                }
            }, 0);
        };

        Peer.prototype.sendPacket = function (id, c, n, label) {
            if (this.chunks[id] && this.chunks[id][c]) {
                var packet = {
                    sum: Talk.md5(this.chunks[id][c]),
                    chunk: this.chunks[id][c],
                    id: id,
                    c: c,
                    n: n
                };

                try  {
                    var channel = this.getDataChannel(label);
                    channel.send(JSON.stringify(packet));
                } catch (error) {
                    if (this.config.serverDataChannel) {
                        this.sendMessage("packet", packet);
                    } else {
                        Talk.warn(error);
                        return {};
                    }
                }
                if (c === n || Object.keys(this.chunks[id]).length === n) {
                    this.sendMessage("packetsEnd", [id, n, label]);
                }

                return packet;
            }
            return {};
        };

        Peer.prototype.handlePacket = function (packet, label) {
            var _this = this;
            if (!packet.id || !packet.c || !packet.n) {
                return;
            }
            if (!this.chunks[packet.id]) {
                this.chunks[packet.id] = {};
            }
            setTimeout(function () {
                if (packet.chunk && Talk.md5(packet.chunk) === packet.sum) {
                    _this.chunks[packet.id][packet.c] = packet.chunk;
                    _this.emit("packetReceived", _this, packet);
                } else {
                    Talk.log("Invalid packet was received: require resend");
                    _this.sendMessage("packetReq", [packet.id, packet.c, packet.n, label]);
                }
            }, 0);
        };

        Peer.prototype.endOfPackets = function (id, n, label) {
            var _this = this;
            if (!this.chunks[id]) {
                return;
            }
            setTimeout(function () {
                var buffer = "";
                for (var i = 1; i <= n; i++) {
                    if (!_this.chunks[id][i]) {
                        Talk.log("Invalid packet was received: require resend");
                        _this.sendMessage("packetReq", [id, i, n, label]);
                        return;
                    }
                    buffer += _this.chunks[id][i];
                }
                buffer = JSON.parse(buffer);
                _this.sendMessage("packetsReceived", id);
                _this.deleteChunks(id);
                _this.emit("data", _this, buffer);
                Talk.log("Data received:", buffer);
            }, 0);
        };

        Peer.prototype.deleteChunks = function (id) {
            if (this.chunks[id]) {
                delete this.chunks[id];
            }
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

        Peer.prototype.initDataChannel = function (channel) {
            var _this = this;
            channel.onclose = function (event) {
                Talk.log("Channel named `%s` was closed", channel.label);
                _this.emit("channelClosed", _this, event);
            };
            channel.onerror = function (event) {
                Talk.warn("Channel error:", event);
                _this.emit("channelError", _this, event);
            };
            channel.onopen = function (event) {
                Talk.log("Channel named `%s` was opened", channel.label);
                _this.emit("channelOpened", _this, event);
            };
            channel.onmessage = function (event) {
                if (event.data) {
                    var payload = JSON.parse(event.data);
                    _this.handlePacket(payload, channel.label);
                }
            };
        };

        Peer.prototype.addDataChannel = function (label, options) {
            var channel = this.pc.createDataChannel(label, options);
            this.initDataChannel(channel);
            this.channels.push(channel);
            Talk.log("Data channel was added:", channel);
            if (!Talk.negotiations) {
                this.negotiate();
            }
            return channel;
        };

        Peer.prototype.onDataChannel = function (event) {
            if (event.channel) {
                this.initDataChannel(event.channel);
                this.channels.push(event.channel);
                Talk.log("Data channel was added:", event.channel);
            } else {
                Talk.warn("Data channel could not be added", event);
            }
        };

        Peer.prototype.addStream = function (stream) {
            if (stream.getVideoTracks().length > 0) {
                this.config.media.mandatory.OfferToReceiveVideo = true;
            }
            if (stream.getAudioTracks().length > 0) {
                this.config.media.mandatory.OfferToReceiveAudio = true;
            }
            this.localStream = this.config.newMediaStream ? new Talk.MediaStream(stream) : stream;
            this.pc.addStream(this.localStream, this.config.media);
            Talk.log("Stream was added:", this.localStream);
            if (!Talk.negotiations) {
                this.negotiate();
            }
        };

        Peer.prototype.onAddStream = function (event) {
            if (event.stream) {
                Talk.log("Remote stream was added:", event.stream);
                this.remoteStream = event.stream;
                this.emit("streamAdded", this, this.remoteStream);
            } else {
                Talk.warn("Remote stream could not be added:", event);
            }
        };

        Peer.prototype.onRemoveStream = function (event) {
            this.remoteStream = {};
            this.emit("streamRemoved", this);
            Talk.log("Remote stream was removed from peer:", event);
        };

        Peer.prototype.mute = function () {
            this.remoteStream.getAudioTracks().forEach(function (track) {
                track.enabled = false;
            });
            Talk.log("Peer audio was muted:", this);
        };

        Peer.prototype.unmute = function () {
            this.remoteStream.getAudioTracks().forEach(function (track) {
                track.enabled = true;
            });
            Talk.log("Peer audio was unmuted:", this);
        };

        Peer.prototype.pause = function () {
            this.remoteStream.getVideoTracks().forEach(function (track) {
                track.enabled = false;
            });
            Talk.log("Peer video was paused:", this);
        };

        Peer.prototype.resume = function () {
            this.remoteStream.getVideoTracks().forEach(function (track) {
                track.enabled = true;
            });
            Talk.log("Peer video was resumed:", this);
        };

        Peer.prototype.muteLocal = function () {
            this.localStream.getAudioTracks().forEach(function (track) {
                track.enabled = false;
            });
            Talk.log("Local audio for the peer was muted:", this);
        };

        Peer.prototype.unmuteLocal = function () {
            this.localStream.getAudioTracks().forEach(function (track) {
                track.enabled = true;
            });
            Talk.log("Local audio for the peer was unmuted:", this);
        };

        Peer.prototype.pauseLocal = function () {
            this.localStream.getVideoTracks().forEach(function (track) {
                track.enabled = false;
            });
            Talk.log("Local video for the peer was paused:", this);
        };

        Peer.prototype.resumeLocal = function () {
            this.localStream.getVideoTracks().forEach(function (track) {
                track.enabled = true;
            });
            Talk.log("Local video for the peer was resumed:", this);
        };
        return Peer;
    })(WildEmitter);
    Talk.Peer = Peer;
})(Talk || (Talk = {}));
var Talk;
(function (Talk) {
    var Room = (function (_super) {
        __extends(Room, _super);
        function Room(handler, host, onOffer, onAnswer) {
            if (typeof host === "undefined") { host = "http://srv.talk.pinting.hu:8000"; }
            if (typeof onOffer === "undefined") { onOffer = Talk.noop; }
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
            if (payload.key && payload.value && payload.peer) {
                var peer = this.handler.get(payload.peer);
                if (!peer && payload.key === "offer") {
                    peer = this.handler.add(payload.peer);
                    this.onAnswer(peer);
                }
                if (peer) {
                    peer.parseMessage(payload.key, payload.value);
                } else {
                    Talk.warn("Peer not found!");
                }
            }
        };

        Room.prototype.join = function (room, type, cb) {
            var _this = this;
            this.server.emit("join", room, type, function (error, clients) {
                if (error) {
                    Talk.warn(error);
                } else {
                    Talk.log("Joined to room `%s`", room);
                    clients.forEach(function (client) {
                        var peer = _this.handler.add(client.id);
                        _this.onOffer(peer);
                        peer.offer();
                    });
                    _this.room = room;
                    _this.type = type;
                }
                Talk.safeCb(cb)(error, clients);
            });
        };

        Room.prototype.leave = function () {
            Talk.log("Room `%s` was left", this.room);
            this.server.emit("leave");
            this.handler.find("close");
            this.room = null;
            this.type = null;
        };

        Room.prototype.remove = function (id) {
            Talk.log("Removing a peer:", id);
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

module.exports = Talk;