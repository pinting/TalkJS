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
         * @param room - Name of the room
         * @param type
         * @param [cb]
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
         * @param payload
         */

        public get(payload: IMessage): void {
            if(payload.key && payload.value && payload.peer) {
                var peer = this.group.get(payload.peer);
                if(!peer && payload.key === "offer") {
                    peer = this.group.add(payload.peer);
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
         * Remove user from the group by id
         * @param id - ID of the peer
         */

        public remove(id): boolean {
            log("Removing a peer:", id);
            var peer = this.group.get(id);
            if(peer) {
                peer.close();
                return true;
            }
            return false;
        }
    }
}