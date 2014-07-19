module Talk.Packet.Buffer {
    /**
     * Receive and send packets
     *
     * @emits Thread#data (data: IBuffer, message: any)
     * @emits Thread#message (message: IMessage)
     * @emits Thread#added (packet: IPacket)
     * @emits Thread#sent (packet: IPacket)
     * @emits Thread#clean
     */

    export class Thread extends WildEmitter {
        private chunkSize: number;
        private buffer: IBuffer;
        private length: number;
        private packets = [];
        private message: any;
        private index = 0;
        public label;

        constructor(label: string) {
            super();

            this.label = label;
        }

        /**
         * Parse a message
         * @param key
         * @param [value]
         */

        public parse(key: string, value?: any): void {
            switch(key) {
                case "meta":
                    this.onMeta(value);
                    break;
                case "ack":
                    this.onAck();
                    break;
                case "end":
                    this.join();
                    break;
                default:
                    this.add(value);
                    break;
            }
        }

        /**
         * Send out a new message
         * @param key
         * @param [value]
         */

        private send(key: string, value?: any): void {
            this.emit("message", <IMessage> {
                value: value,
                key: key
            });
        }

        /**
         * Send meta with a custom message
         * @param message
         */

        private sendMeta(message: any): void {
            this.send("meta", <IMeta> {
                length: this.length,
                message: message
            });
        }

        /**
         * Create a packet
         * @param buffer
         */

        private createPacket(buffer: IBuffer): IPacket {
            return <IPacket> {
                length: this.length,
                index: this.index++,
                payload: buffer
            };
        }

        /**
         * Chunk the buffer to packets
         * @param buffer
         * @param [message] - Custom message
         * @param [size]
         */

        public chunk(buffer: IBuffer, message?: any, size = 10240): void {
            this.length = roundUp((buffer.byteLength || buffer.length || buffer.size) / size);
            this.chunkSize = size;
            this.buffer = buffer;
            this.sendMeta(message);
        }

        /**
         * Executed when meta was received
         * @param meta
         */

        private onMeta(meta: IMeta): void {
            if(this.length) {
                return;
            }
            this.message = meta.message;
            this.length = meta.length;
            this.send("ack");
        }

        /**
         * Executed when ack was received
         */

        private onAck(): void {
            var start = this.index * this.chunkSize;
            var buffer = this.buffer.slice(start, start + this.chunkSize);

            if(this.index < this.length) {
                this.emit("message", buffer);
                this.emit("sent", this.createPacket(buffer));
            }
            else {
                this.send("end");
                this.emit("clean");
            }
        }

        /**
         * Add packet to the thread
         * @param buffer
         */

        private add(buffer: IBuffer): void {
            this.packets.push(buffer);
            this.emit("added", this.createPacket(buffer));
            this.send("ack");
        }

        /**
         * Join packets together
         */

        private join(): void {
            this.emit("data", this.packets, this.message);
        }
    }
}