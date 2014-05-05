/// <reference path="./definitions/socket.io-client.d.ts" />
/// <reference path="./definitions/talk.d.ts" />

import SocketIO = require("socket.io-client");
import WildEmitter = require("wildemitter");
import Handler = require("./handler");

class Connection extends WildEmitter {
    public server: SocketIO.Socket;
    private handler: Handler;
    private warn: Function;
    private log: Function;

    constructor(handler: Handler, host: string) {
        super();

        this.warn = handler.warn.bind(handler);
        this.log = handler.log.bind(handler);

        this.handler = handler;
        this.handler.on("message", this.send.bind(this));
        this.server = SocketIO.connect(host);
        this.server.on("connect", () => this.emit("connectionReady", this.server.socket.sessionid));
        this.server.on("message", this.get.bind(this));
    }

    private send(payload: Message) {
        this.log("Sending:", payload);
        this.server.emit("message", payload);
    }

    private get(payload: Message) {
        this.log("Getting:", payload);
        if(payload.key && payload.value && payload.peer && payload.handler) {
            var peer = this.findHandler(payload.handler).get(payload.peer);
            if(peer) {
                this.log("Peer found!");
                peer.parse(payload.key, payload.value);
            }
            else {
                this.warn("Peer not found!")
            }
        }
    }

    private findHandler(handler: Handler[]) {
        var dest = this.handler;
        handler.forEach((id) => {
            dest = dest.h(id);
        });
        return dest;
    }
}

export = Connection;