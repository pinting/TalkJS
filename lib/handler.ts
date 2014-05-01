/// <reference path="./wildemitter.d.ts" />
/// <reference path="./talk.d.ts" />

import WildEmitter = require("wildemitter");
import Pointer = require("./pointer");
import Shims = require("./shims");
import Util = require("./util");
import Peer = require("./peer");

class Handler extends WildEmitter {
    public config = {
        server: {
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
        stream: new Pointer
    };
    public warn = Util.noop;
    public log = Util.noop;
    public peers = [];

    constructor(options?: Object) {
        super();
        Util.extend(this.config, options);

        if(this.config.logger && this.config.logger.log && this.config.logger.warn) {
            this.warn = this.config.logger.warn.bind(this.config.logger);
            this.log = this.config.logger.log.bind(this.config.logger);
        }
    }

    public add(P?: any): Peer {
        var peer = <Peer> new (P || Peer)(this.config);
        peer.on("message", (key, value) => {
            this.peers.forEach((p) => {
                if(peer !== p) {
                    peer.get(key, JSON.stringify(value));
                }
            });
        });
        peer.on("*", (...args: any[]) => this.emit.apply(this, args));
        this.log("Peer added:", peer);
        this.peers.push(peer);
        return peer;
    }

    public get(args: Object): any {
        var result = this.peers.filter((peer) => {
            for(var key in args) {
                if(args[key] !== peer[key]) {
                    return false;
                }
            }
            return true;
        });
        switch(result.length) {
            case 0:
                return false;
            case 1:
                return result[0];
            default:
                return result;
        }
    }
}

export = Handler;