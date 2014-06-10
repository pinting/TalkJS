/// <reference path="./definitions/socket.io-client" />
/// <reference path="./definitions/wildemitter" />

module Talk {
    export class Connection extends WildEmitter {
        public server: io.Socket;
        public handler: Handler;
        public id: string;

        /**
         * Connection object is meant to sync peers across a Socket.IO server
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
         * @param {Talk.Message} payload
         */

        public send(payload: Message): void {
            this.server.emit("message", payload);
        }

        /**
         * Get a message, then find its peer and parse it
         * @param {Talk.Message} payload
         */

        public get(payload: Message): void {
            if(payload.key && payload.value && payload.peer && payload.handler) {
                var peer = this.findHandler(payload.handler).get(payload.peer);
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
         * Find the handler from the bottom of the array
         * @param {Talk.Handler[]} handler - An array of handlers
         * @returns {Talk.Handler}
         */

        private findHandler(handler: Handler[]): Handler {
            var dest = <Handler> this.handler;
            handler.forEach((id) => {
                dest = dest.h(id);
            });
            return dest;
        }
    }
}