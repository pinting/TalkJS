module Talk {
    export class Group extends WildEmitter {
        public groups = [];
        public config = {};
        public peers = [];
        public id: string;

        /**
         * A group is likes a directory: it can store infinite number of peers,
         * and other groups. The only limit is the limit of the interpreter.
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
         * Create a group
         * @param id - An unique ID
         * @param [H] - Custom Group object
         */

        private createGroup(id: string, H = Group): Group {
            var group = new H(id, this.config);
            group.on("*", (key: string, payload?: IMessage) => {
                switch(key) {
                    case "message":
                        payload = <IMessage> clone(payload);
                        payload.group = [group.id].concat(payload.group);
                        this.emit("message", payload);
                        break;
                    default:
                        this.emit.apply(this, arguments);
                        break;
                }
            });
            log("Group created:", group);
            this.groups.push(group);
            return group;
        }

        /**
         * Open a group, or create it if it is not exists
         * @param id - An unique ID
         * @param [H] - Custom Group object
         */

        public h(id, H = Group): Group {
            var result = <any> false;
            this.groups.some((group: Group) => {
                if(group.id === id) {
                    result = group;
                    return true;
                }
                return false;
            });
            if(!result) {
                result = this.createGroup(id, H);
            }
            return result;
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
         * Get an EXISTING peer by its ID
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
         * Get a list of peers by their parameters and optionally use their methods
         * @param {Object|Function|string} [props] - Properties of the wanted peers: empty means all.
         * Second argument can be passed here too.
         * @param {Function|string} [cb] - Execute a callback on results (peer: Peer) => void,
         * or (if cb a string) call one of their properties.
         */

        public find(props?: any, cb?: any): Peer[] {
            var result;
            if(isObj(props) && !isFunc(props)) {
                result = this.peers.filter((peer) => {
                    return comp(props, peer);
                });
            }
            else {
                result = this.peers;
                cb = props;
            }
            switch(typeof cb) {
                case "function":
                    result.forEach(cb);
                    break;
                case "string":
                    result.forEach((peer) => {
                        peer[cb]();
                    });
            }
            return result;
        }
    }
}