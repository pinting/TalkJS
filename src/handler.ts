/// <reference path="./definitions/mediastream" />
/// <reference path="./definitions/wildemitter" />

module Talk {
    export class Handler extends WildEmitter {
        public handlers = [];
        public config = {};
        public peers = [];
        public id: string;

        /**
         * A handler is likes a directory: it can store infinite number of peers,
         * and other handlers. The only limit is the limit of the interpreter.
         * @param {string|Talk.Handler.config} [id] - An unique ID, or the second
         * argument can be passed here.
         * @param {Talk.Handler.config} [options]
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
         * Create a handler
         * @param {string} id - An unique ID
         * @param {Talk.Handler} [H] - Custom handler object
         * @returns {Talk.Handler}
         */

        private createHandler(id: string, H = Handler): Handler {
            var handler = new H(id, this.config);
            handler.on("*", (...args: any[]) => {
                switch(args[0]) {
                    case "message":
                        var payload = <Message> args[1];
                        payload = clone(payload);
                        payload.handler = [handler.id].concat(payload.handler);
                        this.emit("message", payload);
                        break;
                    default:
                        this.emit.apply(this, args);
                        break;
                }
            });
            log("Handler created:", handler);
            this.handlers.push(handler);
            return handler;
        }

        /**
         * Open a handler, or create it if it is not exists
         * @param {string} id - An unique ID
         * @param {Talk.Handler} [H] - Custom handler object
         * @returns {Talk.Handler}
         */

        public h(id, H = Handler): Handler {
            var result = <any> false;
            this.handlers.some((handler: Handler) => {
                if(handler.id === id) {
                    result = handler;
                    return true;
                }
                return false;
            });
            if(!result) {
                result = this.createHandler(id, H);
            }
            return result;
        }

        /**
         * Add a peer to THIS handler
         * @param {string} id - An unique ID
         * @param {Talk.Peer} [P] - Custom peer object
         * @returns {Talk.Peer}
         */

        public add(id: string, P = Peer): Peer {
            var peer = new P(id, this.config);
            peer.on("*", (...args: any[]) => {
                switch(args[0]) {
                    case "closed":
                        var i = this.peers.indexOf(peer);
                        if(i >= 0) {
                            this.peers.splice(i, 1);
                        }
                    default:
                        this.emit.apply(this, args);
                        break;
                }
            });
            log("Peer added:", peer);
            this.peers.push(peer);
            return peer;
        }

        /**
         * Get an EXISTING peer by its ID
         * @param {string} id
         * @returns {Talk.Peer}
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
         * Second argument can be passed here too, if its empty.
         * @param {Function|string} [cb] - Execute a callback on results (peer: Peer) => void,
         * or (if cb a string) call one of their properties.
         * @returns {Talk.Peer}
         */

        public find(props?: any, cb?: any): Peer[] {
            var result;
            if(isObj(props)) {
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