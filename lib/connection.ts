/// <reference path="./definitions/socket.io-client.d.ts" />
/// <reference path="./definitions/talk.d.ts" />

import SocketIO = require("socket.io-client");
import WildEmitter = require("wildemitter");
import Handler = require("./handler");
import Util = require("./util");

class Connection extends WildEmitter {
    public server: SocketIO.Socket;
    private top: Handler;

    constructor(top: Handler, host: string) {
        super();
        this.top = top;
        this.server = SocketIO.connect(host);
        this.server.on("connect", () => {
            this.emit("connectionReady", this.server.socket.sessionid)
        });
        this.server.on("message", (payload: Message) => {
            top.log("Getting:", payload);
            if(payload.key && payload.value && payload.peer && payload.handler) {
                var peer = this.go(payload.handler).get(payload.peer);
                if(peer) {
                    top.log("Peer found!");
                    peer.parse(payload.key, payload.value);
                }
                else {
                    top.warn("Peer not found!")
                }
            }
        });

        top.on("message", (payload: Message) => {
            top.log("Sending:", payload);
            this.server.emit("message", payload);
        });
    }

    private go(handler: Handler[]) {
        var dest = this.top;
        handler.forEach((id) => {
            dest = dest.h(id);
        });
        return dest;
    }
}

export = Connection;