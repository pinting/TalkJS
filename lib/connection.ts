/// <reference path="./definitions/socket.io-client.d.ts" />
/// <reference path="./definitions/talk.d.ts" />

import SocketIO = require("socket.io-client");
import WildEmitter = require("wildemitter");
import Handler = require("./handler");

class Connection extends WildEmitter {
    public server: SocketIO.Socket;
    public handler: Handler;
    public warn: Function;
    public log: Function;
    public id: string;

    constructor(handler: Handler, host = "http://localhost:8000") {
        super();

        this.warn = handler.warn.bind(handler);
        this.log = handler.log.bind(handler);

        this.handler = handler;
        this.handler.on("message", this.send.bind(this));
        this.server = SocketIO.connect(host);
        this.server.on("connect", () => {
            this.id = this.server.socket.sessionid;
            this.emit("connectionReady", this.id);
        });
        this.server.on("message", this.get.bind(this));
    }

    /**
     * Send a message of a peer
     */

    private send(payload: Message): void {
        this.log("Sending:", payload);
        this.server.emit("message", payload);
    }

    /**
     * Get a message, then find its peer and parse it
     */

    private get(payload: Message): void {
        this.log("Getting:", payload);
        if(payload.key && payload.value && payload.peer && payload.handler) {
            var peer = this.findHandler(payload.handler).get(payload.peer);
            if(peer) {
                this.log("Peer found!");
                peer.parseMessage(payload.key, payload.value);
            }
            else {
                this.warn("Peer not found!")
            }
        }
    }

    /**
     * Find a handler by a hierarchy list
     */

    private findHandler(handler: Handler[]): Handler {
        var dest = <Handler> this.handler;
        handler.forEach((id) => {
            dest = dest.h(id);
        });
        return dest;
    }
}

export = Connection;