var WildEmitter = require("wildemitter");
var io = require("socket.io-client");

var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Talk;
(function (Talk) {
    (function (Connection) {
        var Pure = (function (_super) {
            __extends(Pure, _super);
            function Pure() {
                _super.apply(this, arguments);
            }
            Pure.prototype.send = function (payload) {
            };

            Pure.prototype.get = function (payload) {
                if (payload.key && payload.value && payload.peer && payload.group) {
                    var peer = this.findGroup(payload.group).get(payload.peer);
                    if (peer) {
                        peer.parseMessage(payload.key, payload.value);
                    } else {
                        Talk.warn("Peer not found!");
                    }
                }
            };

            Pure.prototype.connectionReady = function (id) {
                this.id = id;
                this.emit("ready", id);
                Talk.log("Connection is ready:", id);
            };

            Pure.prototype.findGroup = function (group) {
                var dest = this.group;
                group.forEach(function (id) {
                    dest = dest.h(id);
                });
                return dest;
            };
            return Pure;
        })(WildEmitter);
        Connection.Pure = Pure;
    })(Talk.Connection || (Talk.Connection = {}));
    var Connection = Talk.Connection;
})(Talk || (Talk = {}));
var Talk;
(function (Talk) {
    (function (Connection) {
        var Room = (function (_super) {
            __extends(Room, _super);
            function Room() {
                _super.apply(this, arguments);
            }
            Room.prototype.join = function (room, type, cb) {
            };

            Room.prototype.leave = function () {
            };

            Room.prototype.get = function (payload) {
                if (payload.key && payload.value && payload.peer) {
                    var peer = this.group.get(payload.peer);
                    if (!peer && payload.key === "offer") {
                        peer = this.group.add(payload.peer);
                        this.onAnswer(peer);
                    }
                    if (peer) {
                        peer.parseMessage(payload.key, payload.value);
                    } else {
                        Talk.warn("Peer not found!");
                    }
                }
            };

            Room.prototype.remove = function (id) {
                Talk.log("Removing a peer:", id);
                var peer = this.group.get(id);
                if (peer) {
                    peer.close();
                    return true;
                }
                return false;
            };
            return Room;
        })(Connection.Pure);
        Connection.Room = Room;
    })(Talk.Connection || (Talk.Connection = {}));
    var Connection = Talk.Connection;
})(Talk || (Talk = {}));
var Talk;
(function (Talk) {
    (function (Connection) {
        (function (SocketIO) {
            var Pure = (function (_super) {
                __extends(Pure, _super);
                function Pure(group, host) {
                    if (typeof host === "undefined") { host = "http://localhost:8000"; }
                    _super.call(this);

                    this.group = group;
                    this.group.on("message", this.send.bind(this));

                    this.server = io.connect(host);
                    this.server.on("connect", this.connectionReady.bind(this));
                    this.server.on("message", this.get.bind(this));
                }
                Pure.prototype.send = function (payload) {
                    this.server.emit("message", payload);
                };
                return Pure;
            })(Connection.Pure);
            SocketIO.Pure = Pure;
        })(Connection.SocketIO || (Connection.SocketIO = {}));
        var SocketIO = Connection.SocketIO;
    })(Talk.Connection || (Talk.Connection = {}));
    var Connection = Talk.Connection;
})(Talk || (Talk = {}));
var Talk;
(function (Talk) {
    (function (Connection) {
        (function (SocketIO) {
            var Room = (function (_super) {
                __extends(Room, _super);
                function Room(group, host, onOffer, onAnswer) {
                    if (typeof host === "undefined") { host = "http://localhost:8000"; }
                    if (typeof onOffer === "undefined") { onOffer = Talk.noop; }
                    var _this = this;
                    _super.call(this);

                    this.group = group;
                    this.group.on("message", this.send.bind(this));

                    this.server = io.connect(host);
                    this.server.on("connect", function () {
                        _this.connectionReady(_this.server.socket.sessionid);
                    });
                    this.server.on("remove", this.remove.bind(this));
                    this.server.on("message", this.get.bind(this));

                    if (!onAnswer) {
                        this.onAnswer = onOffer;
                    } else {
                        this.onAnswer = onAnswer;
                    }
                    this.onOffer = onOffer;
                }
                Room.prototype.send = function (payload) {
                    this.server.emit("message", payload);
                };

                Room.prototype.join = function (room, type, cb) {
                    var _this = this;
                    this.server.emit("join", room, type, function (error, clients) {
                        if (error) {
                            Talk.warn(error);
                        } else {
                            Talk.log("Joined to room `%s`", room);
                            clients.forEach(function (client) {
                                var peer = _this.group.add(client.id);
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
                    this.group.find("close");
                    this.room = null;
                    this.type = null;
                };
                return Room;
            })(Connection.Room);
            SocketIO.Room = Room;
        })(Connection.SocketIO || (Connection.SocketIO = {}));
        var SocketIO = Connection.SocketIO;
    })(Talk.Connection || (Talk.Connection = {}));
    var Connection = Talk.Connection;
})(Talk || (Talk = {}));
var Talk;
(function (Talk) {
    var Group = (function (_super) {
        __extends(Group, _super);
        function Group(id, options) {
            _super.call(this);
            this.groups = [];
            this.config = {};
            this.peers = [];

            if (!options && !Talk.isStr(id)) {
                options = id;
                id = null;
            }
            Talk.extend(this.config, options);
            this.id = id;
        }
        Group.prototype.createGroup = function (id, H) {
            var _this = this;
            if (typeof H === "undefined") { H = Group; }
            var group = new H(id, this.config);
            group.on("*", function (key, payload) {
                switch (key) {
                    case "message":
                        payload = Talk.clone(payload);
                        payload.group = [group.id].concat(payload.group);
                        _this.emit("message", payload);
                        break;
                    default:
                        _this.emit.apply(_this, arguments);
                        break;
                }
            });
            Talk.log("Group created:", group);
            this.groups.push(group);
            return group;
        };

        Group.prototype.h = function (id, H) {
            if (typeof H === "undefined") { H = Group; }
            var result = false;
            this.groups.some(function (group) {
                if (group.id === id) {
                    result = group;
                    return true;
                }
                return false;
            });
            if (!result) {
                result = this.createGroup(id, H);
            }
            return result;
        };

        Group.prototype.add = function (id, P) {
            var _this = this;
            if (typeof P === "undefined") { P = Talk.Peer; }
            var peer = new P(id, this.config);
            peer.on("*", function (key) {
                switch (key) {
                    case "closed":
                        var i = _this.peers.indexOf(peer);
                        if (i >= 0) {
                            _this.peers.splice(i, 1);
                        }
                    default:
                        _this.emit.apply(_this, arguments);
                        break;
                }
            });
            Talk.log("Peer added:", peer);
            this.peers.push(peer);
            return peer;
        };

        Group.prototype.get = function (id) {
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

        Group.prototype.find = function (props, cb) {
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
        return Group;
    })(WildEmitter);
    Talk.Group = Group;
})(Talk || (Talk = {}));
var Talk;
(function (Talk) {
    Talk.PeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
    Talk.SessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription;
    Talk.IceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate;
    Talk.MediaStream = window.MediaStream || window.webkitMediaStream;
    Talk.URL = window.URL || window.webkitURL;

    Talk.userMedia;

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
        if (Talk.userMedia && !Talk.userMedia.ended) {
            return Talk.userMedia;
        }

        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
        navigator.getUserMedia({
            audio: audio,
            video: video
        }, function (stream) {
            Talk.log("User media request was successful");
            Talk.userMedia = stream;
            safeCb(cb)(null, stream);
        }, function (error) {
            if (video && error && error.name === "DevicesNotFoundError") {
                getUserMedia(true, false, safeCb(cb));
            } else {
                Talk.warn(error);
                safeCb(cb)(error);
            }
        });
    }
    Talk.getUserMedia = getUserMedia;

    function attachMediaStream(element, stream) {
        if (Talk.URL) {
            element.src = Talk.URL.createObjectURL(stream);
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

    function roundUp(x) {
        var f = Math.floor(x);
        if (f < x) {
            return f + 1;
        }
        return f;
    }
    Talk.roundUp = roundUp;

    function uuid() {
        var d = new Date().getTime();
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c === "x" ? r : (r & 0x7 | 0x8)).toString(16);
        });
    }
    Talk.uuid = uuid;

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
            if (!obj1.hasOwnProperty(key) || !obj2.hasOwnProperty(key)) {
                return false;
            }
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
    (function (Packet) {
        (function (Buffer) {
            var Handler = (function (_super) {
                __extends(Handler, _super);
                function Handler(group) {
                    var _this = this;
                    _super.call(this);
                    this.threads = [];

                    group.on("data", function (peer, label, payload) {
                        var thread = _this.get(label);
                        if (payload.key === "meta") {
                            if (thread) {
                                _this.clean(thread);
                            }
                            thread = _this.add(peer, label);
                        }
                        if (thread) {
                            thread.parse(payload.key, payload.value || payload);
                        }
                    });
                }
                Handler.prototype.get = function (label) {
                    var result = false;
                    this.threads.some(function (thread) {
                        if (thread.label === label) {
                            result = thread;
                            return true;
                        }
                        return false;
                    });
                    return result;
                };

                Handler.prototype.add = function (peer, label) {
                    var _this = this;
                    var thread = new Buffer.Thread(label);
                    thread.on("*", function (key, value) {
                        var args = [];
                        for (var _i = 0; _i < (arguments.length - 2); _i++) {
                            args[_i] = arguments[_i + 2];
                        }
                        switch (key) {
                            case "message":
                                peer.sendData(label, value);
                                break;
                            case "data":
                                _this.emit("data", peer, label, value, args[0]);
                            case "clean":
                                _this.clean(thread);
                                break;
                            case "sent":
                                _this.emit("sent", peer, label, value);
                                break;
                            case "added":
                                _this.emit("added", peer, label, value);
                                break;
                        }
                    });
                    Talk.log("New buffer packet handler thread was created `%s`", label);
                    this.threads.push(thread);
                    return thread;
                };

                Handler.prototype.clean = function (thread) {
                    Talk.log("Cleaning up buffer packet handler thread `%s`", thread.label);
                    var i = this.threads.indexOf(thread);
                    if (i >= 0) {
                        this.threads.splice(i, 1);
                        return true;
                    }
                    return false;
                };

                Handler.prototype.send = function (peer, label, buffer, message) {
                    if (!this.get(label)) {
                        var thread = this.add(peer, label);
                        thread.chunk(buffer, message);
                        return thread;
                    } else {
                        Talk.warn("Data channel `%s` is locked", label, peer);
                        return false;
                    }
                };
                return Handler;
            })(WildEmitter);
            Buffer.Handler = Handler;
        })(Packet.Buffer || (Packet.Buffer = {}));
        var Buffer = Packet.Buffer;
    })(Talk.Packet || (Talk.Packet = {}));
    var Packet = Talk.Packet;
})(Talk || (Talk = {}));
var Talk;
(function (Talk) {
    (function (Packet) {
        (function (Buffer) {
            var Thread = (function (_super) {
                __extends(Thread, _super);
                function Thread(label) {
                    _super.call(this);
                    this.packets = [];
                    this.index = 0;

                    this.label = label;
                }
                Thread.prototype.parse = function (key, value) {
                    switch (key) {
                        case "meta":
                            this.onMeta(value);
                            break;
                        case "ack":
                            this.onAck();
                            break;
                        case "end":
                            this.join();
                            break;
                        default:
                            this.add(value);
                            break;
                    }
                };

                Thread.prototype.send = function (key, value) {
                    this.emit("message", {
                        value: value,
                        key: key
                    });
                };

                Thread.prototype.sendMeta = function (message) {
                    this.send("meta", {
                        length: this.length,
                        message: message
                    });
                };

                Thread.prototype.createPacket = function (buffer) {
                    return {
                        length: this.length,
                        index: this.index++,
                        payload: buffer
                    };
                };

                Thread.prototype.chunk = function (buffer, message, size) {
                    if (typeof size === "undefined") { size = 10240; }
                    this.length = Talk.roundUp((buffer.byteLength || buffer.length || buffer.size) / size);
                    this.chunkSize = size;
                    this.buffer = buffer;
                    this.sendMeta(message);
                };

                Thread.prototype.onMeta = function (meta) {
                    if (this.length) {
                        return;
                    }
                    this.message = meta.message;
                    this.length = meta.length;
                    this.send("ack");
                };

                Thread.prototype.onAck = function () {
                    var start = this.index * this.chunkSize;
                    var buffer = this.buffer.slice(start, start + this.chunkSize);

                    if (this.index < this.length) {
                        this.emit("message", buffer);
                        this.emit("sent", this.createPacket(buffer));
                    } else {
                        this.send("end");
                        this.emit("clean");
                    }
                };

                Thread.prototype.add = function (buffer) {
                    this.packets.push(buffer);
                    this.emit("added", this.createPacket(buffer));
                    this.send("ack");
                };

                Thread.prototype.join = function () {
                    this.emit("data", this.packets, this.message);
                };
                return Thread;
            })(WildEmitter);
            Buffer.Thread = Thread;
        })(Packet.Buffer || (Packet.Buffer = {}));
        var Buffer = Packet.Buffer;
    })(Talk.Packet || (Talk.Packet = {}));
    var Packet = Talk.Packet;
})(Talk || (Talk = {}));
var Talk;
(function (Talk) {
    (function (Packet) {
        (function (String) {
            var Handler = (function (_super) {
                __extends(Handler, _super);
                function Handler(group) {
                    var _this = this;
                    _super.call(this);
                    this.threads = [];

                    group.on("data", function (peer, label, payload) {
                        if (payload.id && payload.key) {
                            var thread = _this.get(label, payload.id);
                            if (!thread) {
                                thread = _this.add(peer, label, payload.id);
                            }
                            thread.parse(payload.key, payload.value);
                        }
                    });
                }
                Handler.prototype.send = function (peer, label, payload) {
                    var thread = this.add(peer, label);
                    thread.chunk(payload);
                    return thread;
                };

                Handler.prototype.add = function (peer, label, id) {
                    var _this = this;
                    var thread = new String.Thread(label, id);
                    thread.on("*", function (key, value) {
                        switch (key) {
                            case "message":
                                peer.sendData(label, value);
                                break;
                            case "sent":
                                _this.emit("sent", peer, label, value);
                                break;
                            case "added":
                                _this.emit("added", peer, label, value);
                                break;
                            case "data":
                                _this.emit("data", peer, label, value);
                            case "clean":
                                _this.clean(thread);
                                break;
                        }
                    });
                    Talk.log("New string packet handler thread was created `%s#%s`", label, thread.id);
                    this.threads.push(thread);
                    return thread;
                };

                Handler.prototype.clean = function (thread) {
                    Talk.log("Cleaning up string packet handler thread `%s#%s`", thread.label, thread.id);
                    var i = this.threads.indexOf(thread);
                    if (i >= 0) {
                        this.threads.splice(i, 1);
                        return true;
                    }
                    return false;
                };

                Handler.prototype.get = function (label, id) {
                    var result = false;
                    this.threads.some(function (thread) {
                        if (thread.label === label && thread.id === id) {
                            result = thread;
                            return true;
                        }
                        return false;
                    });
                    return result;
                };
                return Handler;
            })(WildEmitter);
            String.Handler = Handler;
        })(Packet.String || (Packet.String = {}));
        var String = Packet.String;
    })(Talk.Packet || (Talk.Packet = {}));
    var Packet = Talk.Packet;
})(Talk || (Talk = {}));
var Talk;
(function (Talk) {
    (function (Packet) {
        (function (String) {
            var Thread = (function (_super) {
                __extends(Thread, _super);
                function Thread(label, id) {
                    if (typeof id === "undefined") { id = Talk.uuid(); }
                    _super.call(this);
                    this.packets = [];
                    this.sent = 0;

                    this.label = label;
                    this.id = id;
                }
                Thread.prototype.parse = function (key, value) {
                    switch (key) {
                        case "add":
                            this.add(value);
                            break;
                        case "end":
                            this.join();
                            break;
                        case "ask":
                            this.ask(value);
                            break;
                        case "clean":
                            this.clean();
                            break;
                    }
                };

                Thread.prototype.send = function (key, value) {
                    this.emit("message", {
                        value: value,
                        id: this.id,
                        key: key
                    });
                };

                Thread.prototype.get = function (i) {
                    var result = false;
                    this.packets.some(function (packet) {
                        if (packet.index === i) {
                            result = packet;
                            return true;
                        }
                        return false;
                    });
                    return result;
                };

                Thread.prototype.sendPacket = function (packet) {
                    var _this = this;
                    this.send("add", packet);
                    this.emit("sent", packet);

                    if (this.length <= ++this.sent) {
                        setTimeout(function () {
                            _this.send("end");
                        }, 50);
                    }
                };

                Thread.prototype.chunk = function (buffer, size) {
                    var _this = this;
                    if (typeof size === "undefined") { size = 10240; }
                    this.length = Talk.roundUp(buffer.length / size);
                    var i = 0;
                    var p = setInterval(function () {
                        if (i < _this.length) {
                            var start = size * i;
                            var packet = {
                                payload: buffer.slice(start, start + size),
                                length: _this.length,
                                index: i++
                            };
                            _this.packets.push(packet);
                            _this.sendPacket(packet);
                        } else {
                            clearInterval(p);
                        }
                    }, 0);
                };

                Thread.prototype.join = function () {
                    var buffer = "";
                    for (var i = 0; i < this.length; i++) {
                        var packet = this.get(i);
                        if (!packet) {
                            Talk.log("Requesting packet `%d` in thread `%s#%s`", i, this.label, this.id);
                            this.send("ask", i);
                            return;
                        }
                        buffer += packet.payload;
                    }
                    Talk.log("Data received by `%s`:", this.id, buffer);
                    this.emit("data", buffer);
                    this.send("clean");
                };

                Thread.prototype.add = function (packet) {
                    if (!this.length) {
                        this.length = packet.length;
                    }
                    this.packets.push(packet);
                    this.emit("added", packet);
                };

                Thread.prototype.ask = function (i) {
                    var packet = this.get(i);
                    if (packet) {
                        Talk.log("Resending packet `%d` in thread `%s#%s`", i, this.label, this.id);
                        this.sendPacket(packet);
                    }
                };

                Thread.prototype.clean = function () {
                    this.emit("clean");
                };
                return Thread;
            })(WildEmitter);
            String.Thread = Thread;
        })(Packet.String || (Packet.String = {}));
        var String = Packet.String;
    })(Talk.Packet || (Talk.Packet = {}));
    var Packet = Talk.Packet;
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
                        OfferToReceiveAudio: true,
                        OfferToReceiveVideo: true
                    }
                },
                serverDataChannel: true,
                newLocalStream: false,
                negotiate: false
            };
            this.channels = [];
            this.packets = {};

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
                group: [],
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
                case "data":
                    this.handleData(null, value);
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

        Peer.prototype.sendData = function (label, payload) {
            try  {
                var channel = this.getDataChannel(label);
                channel.send(payload.byteLength ? payload : JSON.stringify(payload));
            } catch (error) {
                if (this.config.serverDataChannel) {
                    this.sendMessage("data", payload);
                } else {
                    Talk.warn(error);
                }
            }
        };

        Peer.prototype.handleData = function (label, payload) {
            this.emit("data", this, label, payload);
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
                    try  {
                        var payload = JSON.parse(event.data);
                    } catch (e) {
                        var payload = event.data;
                    }
                    _this.handleData(channel.label, payload);
                }
            };
            channel.binaryType = "arraybuffer";
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
            this.localStream = this.config.newLocalStream ? new Talk.MediaStream(stream) : stream;
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

module.exports = Talk;