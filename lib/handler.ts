/// <reference path="./definitions/mediastream.d.ts" />
/// <reference path="./definitions/wildemitter.d.ts" />
/// <reference path="./definitions/talk.d.ts" />

import WildEmitter = require("wildemitter");
import Pointer = require("./pointer");
import Util = require("./util");
import Peer = require("./peer");

class Handler extends WildEmitter {
    public config = {
        media: {
            mandatory: {
                OfferToReceiveAudio: false,
                OfferToReceiveVideo: false
            }
        },
        logger: <Logger> {
            warn: Util.noop,
            log: Util.noop
        },
        localStream: new Pointer,
        handler: Handler,
        supports: null,
        peer: Peer
    };
    public warn: Function;
    public log: Function;
    public handlers = [];
    public peers = [];
    public id: string;

    constructor(id: string, options?: Object) {
        super();
        Util.extend(this.config, options);

        this.config.supports = this.config.supports || Util.supports();
        this.warn = this.config.logger.warn.bind(this.config.logger);
        this.log = this.config.logger.log.bind(this.config.logger);
        this.id = id;
    }

    /**
     * Get user media
     */

    public getUserMedia(audio: boolean, video: boolean): MediaStream {
        Util.getUserMedia(
            {
                audio: this.config.media.mandatory.OfferToReceiveAudio = audio,
                video: this.config.media.mandatory.OfferToReceiveVideo = video
            },
            (stream: MediaStream) => {
                this.log("User media request was successful");
                this.config.localStream.value = stream;
                this.emit("localStream", stream);
            },
            (error: string) => {
                this.warn(error);
                throw Error(error);
            }
        );
        return this.config.localStream.value;
    }

    /**
     * Create a handler: H argument is for a custom handler
     */

    private createHandler(id: string, H?: any): Handler {
        this.config.handler = H || this.config.handler;
        var handler = <Handler> new this.config.handler(id, this.config);
        handler.on("*", (...args: any[]) => {
            switch(args[0]) {
                case "message":
                    var payload = <Message> args[1];
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

    /**
     * Open a handler, or create it if it is not exists
     */

    public h(id, H?: Object): Handler {
        var result = <any> false;
        this.handlers.some((handler: Handler) => {
            if(handler.id === id) {
                result = handler;
                return true;
            }
            return false;
        });
        if(!result) {
            result = this.createHandler(id, H);
        }
        return result;
    }

    /**
     * Add a peer to THIS handler
     */

    public add(id: string): Peer {
        var peer = <Peer> new this.config.peer(id, this.config);
        peer.on("*", (...args: any[]) => this.emit.apply(this, args));
        this.log("Peer added:", peer);
        this.peers.push(peer);
        return peer;
    }

    /**
     * Get an EXISTING peer
     */

    public get(id: string): Peer {
        var result = <any> false;
        this.peers.some((peer: Peer) => {
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