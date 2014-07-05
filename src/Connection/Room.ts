module Talk.Connection {
    /**
     * @emits Room#ready (id: string)
     */

    export class Room extends Pure {
        public onAnswer: (peer: Peer) => void;
        public onOffer: (peer: Peer) => void;
        public type: string;
        public room: string;

        /**
         * Join to a room
         * @param {string} room - Name of the room
         * @param {string} type
         * @param {Function} [cb]
         */

        public join(room: string, type: string, cb?: (error: any, clients: any[]) => void): void {

        }

        /**
         * Leave the current room
         */

        public leave(): void {

        }

        /**
         * Get a message, then find its peer and parse it
         * @param {Talk.IMessage} payload
         */

        public get(payload: IMessage): void {
            if(payload.key && payload.value && payload.peer) {
                var peer = this.handler.get(payload.peer);
                if(!peer && payload.key === "offer") {
                    peer = this.handler.add(payload.peer);
                    this.onAnswer(peer);
                }
                if(peer) {
                    peer.parseMessage(payload.key, payload.value);
                }
                else {
                    warn("Peer not found!")
                }
            }
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