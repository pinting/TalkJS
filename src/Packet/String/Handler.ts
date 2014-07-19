module Talk.Packet.String {
    /**
     * Manage outgoing and incoming data through string packet handler threads
     *
     * @emits Handler#added (peer: Peer, label: string, packet: IPacket)
     * @emits Handler#sent (peer: Peer, label: string, packet: IPacket)
     * @emits Handler#data (peer: Peer, label: string, data: any)
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
                if(payload.id && payload.key) {
                    var thread = this.get(label, payload.id);
                    if(!thread) {
                        thread = this.add(peer, label, payload.id);
                    }
                    thread.parse(payload.key, payload.value);
                }
            });
        }

        /**
         * Send data and chunk it
         * @param label - Label of the data channel
         * @param payload
         */

        public send(label: string, payload: string): Thread {
            var thread = this.add(this.target, label);
            thread.chunk(payload);
            return thread;
        }

        /**
         * Add a new thread to the handler
         * @param peer - The peer used for data sending
         * @param label - Label of the data channel
         * @param id - ID of the thread
         */

        private add(peer: Peer, label: string, id?: string): Thread {
            var thread = new Thread(label, id);
            thread.on("*", (key: string, value: any) => {
                switch(key) {
                    case "message":
                        peer.sendData(label, value);
                        break;
                    case "sent":
                        this.emit("sent", peer, label, value);
                        break;
                    case "added":
                        this.emit("added", peer, label, value);
                        break;
                    case "data":
                        this.emit("data", peer, label, value);
                    case "clean":
                        this.clean(thread);
                        break;
                }
            });
            log("New string packet handler thread was created `%s#%s`", label, thread.id);
            this.threads.push(thread);
            return thread;
        }

        /**
         * Delete a thread
         * @param thread
         */

        private clean(thread): boolean {
            log("Cleaning up string packet handler thread `%s#%s`", thread.label, thread.id);
            var i = this.threads.indexOf(thread);
            if(i >= 0) {
                this.threads.splice(i, 1);
                return true;
            }
            return false;
        }

        /**
         * Get a thread by its ID and the label of its data channel
         * @param label - Label of the data channel
         * @param id - ID of the thread
         */

        private get(label: string, id: string): Thread {
            var result = <any> false;
            this.threads.some((thread) => {
                if(thread.label === label && thread.id === id) {
                    result = thread;
                    return true;
                }
                return false;
            });
            return result;
        }
    }
}