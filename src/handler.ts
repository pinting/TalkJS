/// <reference path="./definitions/mediastream" />
/// <reference path="./definitions/wildemitter" />

module Talk {
    export class Handler extends WildEmitter {
        public config = {
            media: {
                mandatory: {
                    OfferToReceiveAudio: false,
                    OfferToReceiveVideo: false
                }
            },
            handler: Handler,
            peer: Peer
        };
        public handlers = [];
        public peers = [];
        public id: string;

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
         * Create a handler: H argument is for a custom handler
         */

        private createHandler(id: string, H?: any): Handler {
            this.config.handler = H || this.config.handler;
            var handler = <Handler> new this.config.handler(id, this.config);
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
         */

        public h(id, H?: Object): Handler {
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
         */

        public add(id: string): Peer {
            var peer = <Peer> new this.config.peer(id, this.config);
            peer.on("*", (...args: any[]) => {
                switch(args[0]) {
                    case "peerClosed":
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
         */

        public find(args?: any, cb?: any): Peer[] {
            var result;
            if(isObj(args)) {
                result = this.peers.filter((peer) => {
                    return comp(args, peer);
                });
            }
            else {
                result = this.peers;
                cb = args;
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