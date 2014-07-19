module Talk.Packet.Buffer {
    /**
     * Manage outgoing and incoming data through buffer packet handler threads
     *
     * @emits Handler#data (peer: Peer, label: string, data: IBuffer[], message: any)
     * @emits Handler#added (peer: Peer, label: string, packet: IPacket)
     * @emits Handler#sent (peer: Peer, label: string, packet: IPacket)
     */

    export class Handler extends WildEmitter {
        private threads = <Thread[]> [];
        private target: any;

        /**
         * @param {Talk.Group|Talk.Peer} target
         */

        constructor(target: any) {
            super();

            this.target = target;

            target.on("data", (peer, label, payload: IMessage) => {
                var thread = this.get(label);
                if(payload.key === "meta") {
                    if(thread) {
                        this.clean(thread);
                    }
                    thread = this.add(peer, label);
                }
                if(thread) {
                    thread.parse(payload.key, payload.value || payload);
                }
            });
        }

        /**
         * Get a thread by the label of its data channel
         * @param label - Label of the data channel
         */

        public get(label: string): Thread {
            var result = <any> false;
            this.threads.some((thread) => {
                if(thread.label === label) {
                    result = thread;
                    return true;
                }
                return false;
            });
            return result;
        }

        /**
         * Create a new thread
         * @param peer - The peer used for data sending
         * @param label - Label of the data channel
         */

        public add(peer: Peer, label: string): Thread {
            var thread = new Thread(label);
            thread.on("*", (key, value, ...args) => {
                switch(key) {
                    case "message":
                        peer.sendData(label, value);
                        break;
                    case "data":
                        this.emit("data", peer, label, value, args[0]);
                    case "clean":
                        this.clean(thread);
                        break;
                    case "sent":
                        this.emit("sent", peer, label, value);
                        break;
                    case "added":
                        this.emit("added", peer, label, value);
                        break;
                }
            });
            log("New buffer packet handler thread was created `%s`", label);
            this.threads.push(thread);
            return thread;
        }

        /**
         * Clean up a thread
         * @param thread
         */

        private clean(thread: Thread): boolean {
            log("Cleaning up buffer packet handler thread `%s`", thread.label);
            var i = this.threads.indexOf(thread);
            if(i >= 0) {
                this.threads.splice(i, 1);
                return true;
            }
            return false;
        }

        /**
         * Send data and chunk it
         * @param label - Label of the data channel
         * @param buffer
         * @param message - Custom message
         */

        public send(label: string, buffer: IBuffer, message: any): Thread {
            if(!this.get(label)) {
                var thread = this.add(this.target, label);
                thread.chunk(buffer, message);
                return thread;
            }
            else {
                warn("Data channel `%s` is locked", label, this.target);
                return <any> false;
            }
        }
    }
}