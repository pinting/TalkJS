module Talk.Connection {
    /**
     * @emits Base#ready (id: string)
     */

    export class Pure extends WildEmitter {
        public group: Group;
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
            if(payload.key && payload.value && payload.peer && payload.group) {
                var peer = this.findGroup(<string[]> payload.group).get(payload.peer);
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
         * Find the group from the bottom of the array
         * @param {string[]} group - An array of group ids
         * @returns {Talk.Group}
         */

        public findGroup(group: string[]): Group {
            var dest = <Group> this.group;
            group.forEach((id) => {
                dest = dest.h(id);
            });
            return dest;
        }
    }
}