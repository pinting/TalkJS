module Talk.Packet.String {
    /**
     * Receive and send packets
     *
     * @emits Thread#message (message: IMessage)
     * @emits Thread#added (packet: IPacket)
     * @emits Thread#sent (packet: IPacket)
     * @emits Thread#data (data: any)
     * @emits Thread#clean
     */

    export class Thread extends WildEmitter {
        private packets = <IPacket[]> [];
        private length: number;
        public label: string;
        public id: string;
        private sent = 0;

        /**
         * @param label - Label of the data channel
         * @param id - ID of the thread
         */

        constructor(label: string, id = uuid()) {
            super();

            this.label = label;
            this.id = id;
        }

        /**
         * Parse a message
         * @param key
         * @param value
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
         * @param key
         * @param value
         */

        private send(key: string, value?: any): void {
            this.emit("message", <IMessage> {
                value: value,
                id: this.id,
                key: key
            });
        }

        /**
         * Get a packet by its index
         * @param i
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
         * Send a packet and an end signal if its needed
         * @param packet
         */

        private sendPacket(packet: IPacket) {
            this.send("add", packet);
            this.emit("sent", packet);

            if(this.length <= ++this.sent) {
                setTimeout(() => {
                    this.send("end");
                }, 50);
            }
        }

        /**
         * Chunk the buffer to packets
         * @param buffer
         * @param [size]
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
                    this.sendPacket(packet);
                }
                else {
                    clearInterval(p);
                }
            }, 0);
        }

        /**
         * Join packets together
         */

        public join(): void {
            var buffer = "";
            for(var i = 0; i < this.length; i++) {
                var packet = this.get(i);
                if(!packet) {
                    log("Requesting packet `%d` in thread `%s#%s`", i, this.label, this.id);
                    this.send("ask", i);
                    return;
                }
                buffer += packet.payload;
            }
            log("Data received by `%s`:", this.id, buffer);
            this.emit("data", buffer);
            this.send("clean");
        }

        /**
         * Add packet to the thread
         * @param packet
         */

        public add(packet: IPacket): void {
            if(!this.length) {
                this.length = packet.length;
            }
            this.packets.push(packet);
            this.emit("added", packet);
        }

        /**
         * Ask for a packet from the thread
         * @param i - Index of the packet
         */

        public ask(i: number): void {
            var packet = this.get(i);
            if(packet) {
                log("Resending packet `%d` in thread `%s#%s`", i, this.label, this.id);
                this.sendPacket(packet);
            }
        }

        /**
         * Fire a clean event
         */

        public clean() {
            this.emit("clean");
        }
    }
}