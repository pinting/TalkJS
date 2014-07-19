module Talk {
    export class Group extends WildEmitter {
        public config = {};
        public peers = [];
        public id: string;

        /**
         * A group can store infinite number of peers and can call their methods.
         * @param {string|Talk.Group.config} [id] - An unique ID, or the second
         * argument can be passed here.
         * @param {Talk.Group.config} [options]
         */

        constructor(id?: any, options?: Object) {
            super();

            if(!options && !isStr(id)) {
                options = id;
                id = null;
            }
            extend(this.config, options);
            this.id = id;
        }

        /**
         * Add a peer to THIS group
         * @param id - An unique ID
         * @param [P] - Custom peer object
         */

        public add(id: string, P = Peer): Peer {
            var peer = new P(id, this.config);
            peer.on("*", (key: string) => {
                switch(key) {
                    case "closed":
                        var i = this.peers.indexOf(peer);
                        if(i >= 0) {
                            this.peers.splice(i, 1);
                        }
                    default:
                        this.emit.apply(this, arguments);
                        break;
                }
            });
            log("Peer added:", peer);
            this.peers.push(peer);
            return peer;
        }

        /**
         * Get an EXISTING peer from the group by its ID
         * @param id
         */

        public get(id: string): Peer {
            var result = <any> false;
            this.peers.some((peer: Peer) => {
                if(peer.id === id) {
                    result = peer;
                    return true;
                }
                return false;
            });
            return result;
        }

        /**
         * Get a group of peers by their parameters
         * @param [props] - Properties of the wanted peers: empty means all.
         */

        public find(props = {}): Group {
            var group = new Group;
            this.peers.forEach((peer) => {
                if(hasProps(props, peer)) {
                    group.peers.push(peer);
                }
            });
            return group;
        }

        /**
         * Make an offer to peers of this group
         */

        public offer(): void {
            this.peers.forEach((peer) => {
                peer.offer();
            });
        }

        /**
         * Close every peer in this group
         */

        public close(): void {
            this.peers.forEach((peer) => {
                peer.close();
            });
        }

        /**
         * Send data to the peers of this group
         * @param payload
         * @param [label] - Label of the data channel
         */

        public sendData(label: string, payload: any): void {
            this.peers.forEach((peer) => {
                peer.sendData(label, payload);
            });
        }

        /**
         * Add a data channel to the peers of this group
         * @param label
         * @param [options]
         */

        public addDataChannel(label: string, options?: RTCDataChannelInit): RTCDataChannel[] {
            var result = <RTCDataChannel[]> [];
            this.peers.forEach((peer) => {
                result.push(peer.addDataChannel(label, options));
            });
            return result;
        }

        /**
         * Add our stream to the peers of this group
         * @param stream
         */

        public addStream(stream: MediaStream): void {
            this.peers.forEach((peer) => {
                peer.addStream(stream);
            });
        }

        /**
         * Mute the audio stream of the peers in this group
         */

        public mute(): void {
            this.peers.forEach((peer) => {
                peer.mute();
            });
        }

        /**
         * Unmute the audio stream of the peers in this group
         */

        public unmute(): void {
            this.peers.forEach((peer) => {
                peer.unmute();
            });
        }

        /**
         * Pause video stream of the peers in this group
         */

        public pause(): void {
            this.peers.forEach((peer) => {
                peer.pause();
            });
        }

        /**
         * Resume video stream of the peers in this group
         */

        public resume(): void {
            this.peers.forEach((peer) => {
                peer.resume();
            });
        }

        /**
         * Mute the local audio stream for the peers of this group
         */

        public muteLocal(): void {
            this.peers.forEach((peer) => {
                peer.muteLocal();
            });
        }

        /**
         * Unmute the local audio stream for the peers of this group
         */

        public unmuteLocal(): void {
            this.peers.forEach((peer) => {
                peer.unmuteLocal();
            });
        }

        /**
         * Pause the local video stream for the peers of this group
         */

        public pauseLocal(): void {
            this.peers.forEach((peer) => {
                peer.pauseLocal();
            });
        }

        /**
         * Resume the local video stream for the peers of this group
         */

        public resumeLocal(): void {
            this.peers.forEach((peer) => {
                peer.resumeLocal();
            });
        }
    }
}