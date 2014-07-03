module Talk.Connection.SocketIO {
    /**
     * A handler is likes a directory: it can store infinite number of peers,
     * and other handlers. The only limit is the limit of the interpreter.
     *
     * @emits Pure#ready (id: string)
     */

    export class Pure extends WildEmitter {
        public server: io.Socket;
        public handler: Handler;
        public id: string;

        /**
         * Pure connection object is meant to sync peers across a Socket.IO server
         * @param {Talk.Handler} handler
         * @param {string} [host]
         */

        constructor(handler: Handler, host = "http://srv.talk.pinting.hu:8000") {
            super();

            this.handler = handler;
            this.handler.on("message", this.send.bind(this));
            this.server = io.connect(host);
            this.server.on("connect", () => {
                this.id = this.server.socket.sessionid;
                this.emit("ready", this.id);
                log("Connection is ready:", this.id);
            });
            this.server.on("message", this.get.bind(this));
        }

        /**
         * Send a message of a peer
         * @param {Talk.IMessage} payload
         */

        public send(payload: IMessage): void {
            this.server.emit("message", payload);
        }

        /**
         * Get a message, then find its peer and parse it
         * @param {Talk.IMessage} payload
         */

        public get(payload: IMessage): void {
            if(payload.key && payload.value && payload.peer && payload.handler) {
                var peer = this.findHandler(<string[]> payload.handler).get(payload.peer);
                if(peer) {
                    peer.parseMessage(payload.key, payload.value);
                }
                else {
                    warn("Peer not found!")
                }
            }
        }

        /**
         * Find the handler from the bottom of the array
         * @param {string[]} handler - An array of handler ids
         * @returns {Talk.Handler}
         */

        private findHandler(handler: string[]): Handler {
            var dest = <Handler> this.handler;
            handler.forEach((id) => {
                dest = dest.h(id);
            });
            return dest;
        }
    }
}