module Talk.Packet.String {
    /**
     * Receive and send packets
     *
     * @emits Packer#data (peer: Peer, label: string, data: any)
     * @emits Packer#clean
     */

    export class Packer extends WildEmitter {
        private packets = <IPacket[]> [];
        private length: number;
        public label: string;
        private peer: Peer;
        public id: string;

        /**
         * @param {Talk.Peer} peer
         * @param {string} label - Label of the data channel
         * @param {string} id - ID of the packer
         */

        constructor(peer: Peer, label: string, id = uuid()) {
            super();

            this.label = label;
            this.peer = peer;
            this.id = id;

            peer.on("data", (peer, label, payload: IMessage) => {
                if(payload && payload.id === this.id && label === this.label) {
                    this.parse(payload.key, payload.value);
                }
            });
        }

        /**
         * Parse a message
         * @param {string} key
         * @param {*} value
         */

        public parse(key: string, value?: any): void {
            switch(key) {
                case "add":
                    this.add(value);
                    break;
                case "end":
                    this.join();
                    break;
                case "ask":
                    this.ask(value);
                    break;
                case "clean":
                    this.clean();
                    break;
            }
        }

        /**
         * Send out a new message
         * @param {string} key
         * @param {*} value
         */

        private send(key: string, value?: any): void {
            console.debug("SENDING:", key, value);
            this.peer.sendData(this.label, {
                value: value,
                id: this.id,
                key: key
            })
        }

        /**
         * Get a packet by its index
         * @param {number} i
         * @returns {*}
         */

        private get(i: number): IPacket {
            var result = <any> false;
            this.packets.some((packet: IPacket) => {
                if(packet.index === i) {
                    result = packet;
                    return true;
                }
                return false;
            });
            return result;
        }

        /**
         * Chunk the buffer to packets
         * @param {string} buffer
         * @param {number} [size]
         */

        public chunk(buffer: any, size = 10240): void {
            this.length = roundUp(buffer.length / size);
            var i = 0;
            var p = setInterval(() => {
                if(i < this.length) {
                    var start = size * i;
                    var packet = {
                        payload: buffer.slice(start, start + size),
                        length: this.length,
                        index: i++
                    };
                    this.packets.push(packet);
                    this.send("add", packet);
                }
                else {
                    clearInterval(p);
                    setTimeout(() => {
                        this.send("end");
                    }, 50);
                }
            }, 0);
        }

        /**
         * Join payload of the packets together
         */

        public join(): void {
            var buffer = "";
            for(var i = 0; i < this.length; i++) {
                var packet = this.get(i);
                if(!packet) {
                    this.send("ask", i);
                    return;
                }
                buffer += packet.payload;
            }
            log("Data received:", buffer);
            this.emit("data", this.peer, this.label, buffer);
            this.send("clean");
        }

        /**
         * Add packet to the packer
         * @param {*} packet
         */

        public add(packet: IPacket): void {
            if(!this.length) {
                this.length = packet.length;
            }
            this.packets.push(packet);
        }

        /**
         * Ask for a packet from the packer
         * @param {number} i - Index of the packet
         */

        public ask(i: number): void {
            var packet = this.get(i);
            if(packet) {
                this.send("add", packet);
                setTimeout(() => {
                    this.send("end");
                }, 50);
            }
        }

        /**
         * Fire a clean event
         */

        public clean() {
            log("Clean up string packet packer `%s`", this.id);
            this.emit("clean");
        }
    }
}