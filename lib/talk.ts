/// <reference path="./wildemitter/wildemitter.d.ts" />
/// <reference path="./webrtc/MediaStream.d.ts" />
/// <reference path="./talk.d.ts" />

import WildEmitter = require("wildemitter");
import Handler = require("./handler");
import Pointer = require("./pointer");
import Network = require("./network");
import Shims = require("./shims");
import Peer = require("./peer");
import Util = require("./util");

class Talk extends Handler {
    static Network = Network;
    static Pointer = Pointer;
    static Handler = Handler;
    static Util = Util;
    static Peer = Peer;

    public localStream = new Pointer;

    constructor(options?: Object) {
        super(null, options);
        Util.extend(this.config, {
            stream: this.localStream
        });

        this.on("*", function(...args: any[]) {
            this.log.apply(this, ["Event: "].concat(args));
        });
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