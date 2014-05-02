/// <reference path="./socket.io/socket.io-client.d.ts" />

import SocketIO = require("socket.io-client");
import Handler = require("./handler");
import Util = require("./util");

class Network {
    private server: SocketIO.Socket;
    private top: Handler;

    constructor(top: Handler, host: string) {
        this.top = top;
        this.server = SocketIO.connect(host);
        this.server.on("message", (type: string, payload: Message) => {
            top.log("Getting:", type, payload);
            if(payload.key && payload.value && payload.peer && payload.handler) {
                var peer = this.go(payload.handler).get(payload.peer);
                if(peer) {
                    peer.parse(payload.key, payload.value);
                }
            }
        });

        top.on("message", (type, payload) => {
            top.log("Sending:", type, payload);
            this.server.emit("message", type, payload);
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

export = Network;