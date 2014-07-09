module Talk.Connection {
    /**
     * @emits Base#ready (id: string)
     */

    export class Pure extends WildEmitter {
        public handler: Handler;
        public id: string;

        /**
         * Send a message of a peer
         * @param {Talk.IMessage} payload
         */

        public send(payload: IMessage): void {

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
         * Executed when the connection is ready for use
         * @param {string} id - Unique ID of the connection
         */

        public connectionReady(id: string) {
            this.id = id;
            this.emit("ready", id);
            log("Connection is ready:", id);
        }

        /**
         * Find the handler from the bottom of the array
         * @param {string[]} handler - An array of handler ids
         * @returns {Talk.Handler}
         */

        public findHandler(handler: string[]): Handler {
            var dest = <Handler> this.handler;
            handler.forEach((id) => {
                dest = dest.h(id);
            });
            return dest;
        }
    }
}