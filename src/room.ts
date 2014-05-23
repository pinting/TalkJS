module Talk {
    export class Room extends Connection {
        public onAnswer: (peer: Peer) => void;
        public onOffer: (peer: Peer) => void;
        public type: string;
        public room: string;

        /**
         * Room is an extended connection object: it can handle a handler like
         * chat room, so it will add and remove peers when its needed.
         * @param {Talk.Handler} handler
         * @param {string} [host]
         * @param {Function} [onOffer]
         * @param {Function} [onAnswer] - If its not defined, onOffer will used
         */

        constructor(handler: Handler, host = "http://localhost:8000", onOffer = noop, onAnswer?: any) {
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
         * @param {Talk.Message} payload
         */

        public get(payload: Message): void {
            log("Getting:", payload);
            if(payload.key && payload.value && payload.peer) {
                var peer = this.handler.get(payload.peer);
                if(!peer && payload.key === "offer") {
                    peer = this.handler.add(payload.peer);
                    this.onAnswer(peer);
                }
                if(peer) {
                    log("Peer found!");
                    peer.parseMessage(payload.key, payload.value);
                }
                else {
                    warn("Peer not found!")
                }
            }
        }

        /**
         * Join to a room
         * @param {string} room - Name of the room
         * @param {string} type
         * @param {Function} [cb]
         */

        public join(room: string, type: string, cb?: (error: any, clients: any[]) => void) {
            this.server.emit("join", room, type, (error, clients) => {
                log("Joined to room `%s`", room);
                if(error) {
                    warn(error);
                }
                clients.forEach((client) => {
                    var peer = this.handler.add(client.id);
                    this.onOffer(peer);
                    peer.offer();
                });
                this.room = room;
                this.type = type;
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

        /**
         * Remove user from the handler by id
         * @param {string} id - ID of the peer
         * @returns {boolean}
         */

        public remove(id): boolean {
            log("Removing a peer:", id);
            var peer = this.handler.get(id);
            if(peer) {
                peer.close();
                return true;
            }
            return false;
        }
    }
}