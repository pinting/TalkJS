/// <reference path="./wildemitter/wildemitter.d.ts" />
/// <reference path="./talk.d.ts" />

import WildEmitter = require("wildemitter");
import Pointer = require("./pointer");
import Shims = require("./shims");
import Util = require("./util");
import Peer = require("./peer");

class Handler extends WildEmitter {
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
        stream: new Pointer,
        handler: Handler,
        peer: Peer
    };
    public warn = Util.noop;
    public log = Util.noop;
    public handlers = [];
    public id: string;
    public peers = [];

    constructor(id: string, options?: Object) {
        super();
        Util.overwrite(this.config, options);

        if(this.config.logger) {
            if(this.config.logger.warn) {
                this.warn = this.config.logger.warn.bind(this.config.logger);
            }
            if(this.config.logger.log) {
                this.log = this.config.logger.log.bind(this.config.logger);
            }
        }

        this.id = id;
    }

    public addHandler(id: string, H?: any): Handler {
        this.config.handler = H || this.config.handler;
        var handler = <Handler> new this.config.handler(id, this.config);
        handler.on("*", (...args: any[]) => {
            switch(args[0]) {
                case "message":
                    var payload = args[1];
                    payload = Util.clone(payload);
                    payload.handler = [handler.id].concat(payload.handler);
                    this.emit("message", payload);
                    break;
                default:
                    this.emit.apply(this, args);
                    break;
            }
        });
        this.log("Handler created:", handler);
        this.handlers.push(handler);
        return handler;
    }

    public h(id, H?: Object): Handler {
        var result = <any> false;
        this.handlers.some((handler) => {
            if(handler.id === id) {
                result = handler;
                return true;
            }
            return false;
        });
        if(!result) {
            result = this.addHandler(id, H);
        }
        return result;
    }

    public add(id: string): Peer {
        var peer = <Peer> new this.config.peer(id, this.config);
        peer.on("*", (...args: any[]) => this.emit.apply(this, args));
        this.log("Peer added:", peer);
        this.peers.push(peer);
        return peer;
    }

    public get(id: string): Peer {
        var result = <any> false;
        this.peers.some((peer) => {
            if(peer.id === id) {
                result = peer;
                return true;
            }
            return false;
        });
        return result;
    }
}

export = Handler;