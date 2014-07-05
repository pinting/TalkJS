module Talk.Connection.SocketIO {
    /**
     * Room is an advanced connection type: it can handle a handler as a
     * chat room, so it will add and remove peers.
     *
     * @emits Room#ready (id: string)
     */

    export class Room extends Connection.Room {
        public server: io.Socket;

        /**
         * @param {Talk.Handler} handler
         * @param {string} [host]
         * @param {Function} [onOffer]
         * @param {Function} [onAnswer] - If its not defined, onOffer will be used
         */

        constructor(handler: Handler, host = "http://srv.talk.pinting.hu:8000", onOffer = noop, onAnswer?: any) {
            super();

            this.handler = handler;
            this.handler.on("message", this.send.bind(this));

            this.server = io.connect(host);
            this.server.on("connect", this.connectionReady.bind(this));
            this.server.on("message", this.get.bind(this));

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
         * Send a message of a peer
         * @param {Talk.IMessage} payload
         */

        public send(payload: IMessage): void {
            this.server.emit("message", payload);
        }

        /**
         * Join to a room
         * @param {string} room - Name of the room
         * @param {string} type
         * @param {Function} [cb]
         */

        public join(room: string, type: string, cb?: (error: any, clients: any[]) => void) {
            this.server.emit("join", room, type, (error, clients) => {
                if(error) {
                    warn(error);
                }
                else {
                    log("Joined to room `%s`", room);
                    clients.forEach((client) => {
                        var peer = this.handler.add(client.id);
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
            this.handler.find("close");
            this.room = null;
            this.type = null;
        }
    }
}