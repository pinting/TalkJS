module Talk.Connection.SocketIO {
    /**
     * Pure connection object is meant to sync peers across a Socket.IO server
     *
     * @emits Pure#ready (id: string)
     */

    export class Pure extends Connection.Pure {
        public server: io.Socket;

        /**
         * @param {Talk.Handler} handler
         * @param {string} [host]
         */

        constructor(handler: Handler, host = "http://localhost:8080") {
            super();

            this.handler = handler;
            this.handler.on("message", this.send.bind(this));

            this.server = io.connect(host);
            this.server.on("connect", this.connectionReady.bind(this));
            this.server.on("message", this.get.bind(this));
        }

        /**
         * Send a message of a peer
         * @param {Talk.IMessage} payload
         */

        public send(payload: IMessage): void {
            this.server.emit("message", payload);
        }
    }
}