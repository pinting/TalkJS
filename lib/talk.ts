/// <reference path="./socket.io/socket.io-client.d.ts" />
/// <reference path="./wildemitter/wildemitter.d.ts" />
/// <reference path="./webrtc/MediaStream.d.ts" />
/// <reference path="./talk.d.ts" />

import SocketIO = require("socket.io-client");
import WildEmitter = require("wildemitter");
import Handler = require("./handler");
import Pointer = require("./pointer");
import Shims = require("./shims");
import Peer = require("./peer");
import Util = require("./util");

class Talk extends WildEmitter {
    public localStream = new Pointer;
    public config = {
        configuration: {
            iceServers: [
                {"url": "stun:stun.l.google.com:19302"},
                {"url": "stun:stun1.l.google.com:19302"},
                {"url": "stun:stun2.l.google.com:19302"},
                {"url": "stun:stun3.l.google.com:19302"},
                {"url": "stun:stun4.l.google.com:19302"}
            ]
        },
        options: {
            optional: [
                {DtlsSrtpKeyAgreement: true},
                {RtpDataChannels: true}
            ]
        },
        constraints: {
            mandatory: {
                OfferToReceiveAudio: true,
                OfferToReceiveVideo: true
            }
        },
        logger: <Logger> {
            warn: Util.noop,
            log: Util.noop
        },
        server: "http://localhost:8000",
        stream: this.localStream
    };
    public server: SocketIO.Socket;
    public warn = Util.noop;
    public log = Util.noop;
    public handlers = {};

    static Pointer = Pointer;
    static Handler = Handler;
    static Util = Util;
    static Peer = Peer;

    constructor(options?: Object) {
        super();
        Util.overwrite(this.config, options);

        if(this.config.logger && this.config.logger.log && this.config.logger.warn) {
            this.warn = this.config.logger.warn.bind(this.config.logger);
            this.log = this.config.logger.log.bind(this.config.logger);
        }

        /* DISABLED
        this.server = SocketIO.connect(this.config.server);
        this.server.on("message", (handler, peer, key, value) => {
            this.get(handler).get({id: peer}).get(key, value);
        });
        */

        this.on("*", function(...args: any[]) {
            this.log.apply(this, ["Event: "].concat(args));
        });
    }

    public create(id: string, H?: any): Handler {
        if(!this.handlers[id]) {
            var handler = new (H || Handler)(this.config);
            handler.on("*", (type, peer, ...args: any[]) => {
                this.emit.apply(this, [type, id, peer].concat(args))
            });
            this.handlers[id] = handler;
            return handler;
        }
        throw Error("Handler already exists!");
    }

    public get(id): Handler {
        if(this.handlers[id]) {
            return this.handlers[id];
        }
        return this.create(id);
    }

    public getUserMedia(audio: boolean, video: boolean): MediaStream {
        Shims.getUserMedia(
            {
                audio: this.config.constraints.mandatory.OfferToReceiveAudio = audio,
                video: this.config.constraints.mandatory.OfferToReceiveVideo = video
            },
            (stream) => {
                this.localStream.set(stream);
                this.emit("localStream", stream);
            },
            (error) => {
                this.warn(error);
                throw Error(error);
            }
        );
        return this.localStream.get();
    }
}

export = Talk;