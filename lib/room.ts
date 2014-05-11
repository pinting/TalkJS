/// <reference path="./definitions/socket.io-client.d.ts" />
/// <reference path="./definitions/talk.d.ts" />

import Connection = require("./connection");
import SocketIO = require("socket.io-client");
import WildEmitter = require("wildemitter");
import Handler = require("./handler");
import Util = require("./util");

class Room extends Connection {
    constructor(handler: Handler, host = "http://localhost:8000") {
        super(handler, host);
        this.server.on("remove", (id) => {
            var peer = this.handler.get(id);
            if(peer) {
                peer.close();
            }
        });
    }

    public join(room, type, cb) {
        this.server.emit("join", room, type, function(error, clients) {
            if(error) {
                this.warn(error);
            }
            clients.forEach((client) => {
                this.handler.add(client.id);
                // TODO: Add a stream, than make an offer, etc...
            });
            Util.safeCb(cb)(error, clients);
        });
    }

    public leave() {
        this.server.emit("leave");
        this.handler.peers("close");
    }
}

export = Connection;