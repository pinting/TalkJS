/// <reference path="./definitions/socket.io-client.d.ts" />
/// <reference path="./definitions/talk.d.ts" />

import SocketIO = require("socket.io-client");
import Connection = require("./connection");
import WildEmitter = require("wildemitter");
import Handler = require("./handler");
import Util = require("./util");
import Peer = require("./peer");

class Room extends Connection {
    public onAnswer: (peer: Peer) => void;
    public onOffer: (peer: Peer) => void;
    public type: string;
    public room: string;

    constructor(handler: Handler, host = "http://localhost:8000", onOffer = Util.noop, onAnswer?: any) {
        super(handler, host);

        if(!onAnswer) {
            this.onAnswer = onOffer;
        }
        else {
            this.onAnswer = onAnswer;
        }
        this.onOffer = onOffer;
        this.server.on("remove", this.remove.bind(this));
    }

    /**
     * Get a message, then find its peer and parse it
     */

    public get(payload: Message): void {
        this.log("Getting:", payload);
        if(payload.key && payload.value && payload.peer) {
            var peer = this.handler.get(payload.peer);
            if(!peer && payload.key === "offer") {
                peer = this.handler.add(payload.peer);
                this.onAnswer(peer);
            }
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
     * Join to a room
     */

    public join(room: string, type: string, cb: (error: any, clients: any[]) => void) {
        this.server.emit("join", room, type, (error, clients) => {
            this.log("Joined to room `%s`", room);
            if(error) {
                this.warn(error);
            }
            clients.forEach((client) => {
                var peer = this.handler.add(client.id);
                this.onOffer(peer);
                peer.offer();
            });
            this.room = room;
            this.type = type;
            Util.safeCb(cb)(error, clients);
        });
    }

    /**
     * Leave the current room
     */

    public leave() {
        this.log("Room `%s` was left", this.room);
        this.server.emit("leave");
        this.handler.peers("close");
        this.room = null;
        this.type = null;
    }

    /**
     * Remove user from the handler by id
     */

    public remove(id): boolean {
        this.log("Removing a peer:", id);
        var peer = this.handler.get(id);
        if(peer) {
            peer.close();
            return true;
        }
        return false;
    }
}

export = Room;