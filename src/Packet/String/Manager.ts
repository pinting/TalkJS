module Talk.Packet.String {
    /**
     * Manage outgoing and incoming data through string packet packers
     *
     * @emits Manager#packetReceived (peer: Peer, packet: IPacket)
     * @emits Manager#data (peer: Peer, label: string, data: any)
     * @emits Manager#packetSent (peer: Peer, packet: IPacket)
     */

    export class Manager extends WildEmitter {
        private packers = <Packer[]> [];

        /**
         * @param {Talk.Peer|Talk.Handler} target
         */

        constructor(target: any) {
            super();

            target.on("data", (peer, label, payload: IMessage) => {
                if(payload.id && payload.key && !this.get(label, payload.id)) {
                    log("Creating a new string packet packer");
                    var packer = this.add(peer, label, payload.id);
                    packer.parse(payload.key, payload.value);
                    this.packers.push(packer);
                }
            });
        }

        /**
         * Send data and chunk it
         * @param {Talk.Peer} peer - The peer used to send the data
         * @param {string} label - Label of the data channel
         * @param {*} payload
         * @returns {*}
         */

        public send(peer: Peer, label: string, payload: string): Packer {
            var packer = this.add(peer, label);
            packer.chunk(payload);
            return packer;
        }

        /**
         * Add a new packer to the manager
         * @param {Talk.Peer} peer - The peer used for data sending
         * @param {string} label - Label of the data channel
         * @param {string} id - ID of the packer
         * @returns {*}
         */

        private add(peer: Peer, label: string, id?: string): Packer {
            var packer = new Packer(peer, label, id);
            packer.on("*", (key: string) => {
                switch(key) {
                    case "data":
                        this.emit.apply(this, arguments);
                    case "clean":
                        this.clean(packer);
                        break;
                    default:
                        this.emit.apply(this, arguments);
                        break;
                }
            });
            return packer;
        }

        /**
         * Delete a packer
         * @param packer
         * @returns {boolean}
         */

        private clean(packer): boolean {
            var i = this.packers.indexOf(packer);
            if(i >= 0) {
                this.packers.splice(i, 1);
                return true;
            }
            return false;
        }

        /**
         * Get a packer by its ID and label of its data channel
         * @param {string} label - Label of the data channel
         * @param {string} id - ID of the packer
         * @returns {*}
         */

        private get(label: string, id: string): Packer {
            var result = <any> false;
            this.packers.some((packer) => {
                if(packer.label === label && packer.id === id) {
                    result = packer;
                    return true;
                }
                return false;
            });
            return result;
        }
    }
}