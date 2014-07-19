module Talk.Connection.SocketIO {
    /**
     * Room is an advanced connection type: it can handle a group as a
     * chat room, so it will add and remove peers.
     *
     * @emits Room#ready (id: string)
     */

    export class Room extends Connection.Room {
        public server: io.Socket;

        /**
         * @param group
         * @param [host]
         * @param [onOffer]
         * @param [onAnswer] - If its not defined, onOffer will be used
         */

        constructor(group: Group, host = "http://localhost:8000", onOffer = noop, onAnswer?: any) {
            super();

            this.group = group;
            this.group.on("message", this.send.bind(this));

            this.server = io.connect(host);
            this.server.on("connect", () => {
                this.connectionReady(this.server.socket.sessionid);
            });
            this.server.on("remove", this.remove.bind(this));
            this.server.on("message", this.get.bind(this));

            if(!onAnswer) {
                this.onAnswer = onOffer;
            }
            else {
                this.onAnswer = onAnswer;
            }
            this.onOffer = onOffer;
        }

        /**
         * Send a message of a peer
         * @param payload
         */

        public send(payload: IMessage): void {
            this.server.emit("message", payload);
        }

        /**
         * Join to a room
         * @param room - Name of the room
         * @param type
         * @param [cb]
         */

        public join(room: string, type: string, cb?: (error: any, clients: any[]) => void) {
            this.server.emit("join", room, type, (error, clients) => {
                if(error) {
                    warn(error);
                }
                else {
                    log("Joined to room `%s`", room);
                    clients.forEach((client) => {
                        var peer = this.group.add(client.id);
                        this.onOffer(peer);
                        peer.offer();
                    });
                    this.room = room;
                    this.type = type;
                }
                safeCb(cb)(error, clients);
            });
        }

        /**
         * Leave the current room
         */

        public leave() {
            log("Room `%s` was left", this.room);
            this.server.emit("leave");
            this.group.find("close");
            this.room = null;
            this.type = null;
        }
    }
}