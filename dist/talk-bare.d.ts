/// <reference path="../src/definitions/socket.io-client.d.ts" />
/// <reference path="../src/definitions/wildemitter.d.ts" />
/// <reference path="../src/definitions/mediastream.d.ts" />
/// <reference path="../src/definitions/rtcpeerconnection.d.ts" />
/// <reference path="../src/definitions/crypto.d.ts" />
declare module Talk {
    class Connection extends WildEmitter {
        public server: io.Socket;
        public handler: Handler;
        public id: string;
        constructor(handler: Handler, host?: string);
        public send(payload: Message): void;
        public get(payload: Message): void;
        private findHandler(handler);
    }
}
declare module Talk {
    class Handler extends WildEmitter {
        public config: {
            media: {
                mandatory: {
                    OfferToReceiveAudio: boolean;
                    OfferToReceiveVideo: boolean;
                };
            };
            handler: typeof Handler;
            peer: typeof Peer;
        };
        public handlers: any[];
        public peers: any[];
        public id: string;
        constructor(id?: any, options?: Object);
        private createHandler(id, H?);
        public h(id: any, H?: Object): Handler;
        public add(id: string): Peer;
        public get(id: string): Peer;
        public find(args?: any, cb?: any): Peer[];
    }
}
declare module Talk {
    interface Message {
        handler: any[];
        peer: string;
        key: string;
        value: any;
    }
    interface Supports {
        negotiation: boolean;
        media: boolean;
        blob: boolean;
        sctp: boolean;
        data: boolean;
    }
    interface Logger {
        warn: (...args: any[]) => void;
        log: (...args: any[]) => void;
    }
    var PeerConnection: any;
    var SessionDescription: any;
    var IceCandidate: any;
    var MediaStream: any;
    var log: typeof noop;
    var warn: typeof noop;
    var userMedia: any;
    var supports: Supports;
    function logger(obj: Logger): void;
    function getUserMedia(audio?: boolean, video?: boolean, cb?: (stream: MediaStream) => void): MediaStream;
    function attachMediaStream(element: HTMLVideoElement, stream: MediaStream): HTMLVideoElement;
    function safeCb(obj: any): any;
    function safeStr(obj: any): string;
    function safeText(obj: any): string;
    function isEmpty(obj: any): boolean;
    function isStr(obj: any): boolean;
    function isObj(obj: any): boolean;
    function isNum(obj: any): boolean;
    function randNum(min?: number, max?: number): number;
    function randWord(length?: number): string;
    function sha256(obj: string): string;
    function find(list: any[], obj: any): boolean;
    function extend(obj: Object, source: Object): Object;
    function clone(obj: any): any;
    function comp(obj1: Object, obj2: Object): boolean;
    function noop(...args: any[]): void;
}
declare module Talk {
    class Peer extends WildEmitter {
        public config: {
            options: {
                iceServers: {
                    "url": string;
                }[];
            };
            media: {
                mandatory: {
                    OfferToReceiveAudio: boolean;
                    OfferToReceiveVideo: boolean;
                };
            };
            negotiate: boolean;
        };
        public remoteStream: MediaStream;
        public localStream: MediaStream;
        private pc;
        private channels;
        public id: string;
        constructor(id: string, options?: Object);
        private sendMessage(key, value);
        public parseMessage(key: string, value: Object): boolean;
        public addStream(stream: MediaStream): void;
        private onAddStream(event);
        private onRemoveStream(event);
        public send(label: string, payload: any): boolean;
        private getDataChannel(label);
        private configDataChannel(channel);
        public addDataChannel(label: string, options?: RTCDataChannelInit): RTCDataChannel;
        private onDataChannel(event);
        private onConnectionChange();
        private onCandidate(event);
        private handleCandidate(ice);
        private negotiate();
        public offer(): void;
        private answer(offer);
        private handleAnswer(answer);
        public close(): void;
        public mute(): void;
        public unmute(): void;
        public pause(): void;
        public resume(): void;
        public muteLocal(): void;
        public unmuteLocal(): void;
        public pauseLocal(): void;
        public resumeLocal(): void;
    }
}
declare module Talk {
    class Pointer extends WildEmitter {
        private memory;
        constructor(value?: any);
        public value : any;
    }
}
declare module Talk {
    class Room extends Connection {
        public onAnswer: (peer: Peer) => void;
        public onOffer: (peer: Peer) => void;
        public type: string;
        public room: string;
        constructor(handler: Handler, host?: string, onOffer?: typeof noop, onAnswer?: any);
        public get(payload: Message): void;
        public join(room: string, type: string, cb?: (error: any, clients: any[]) => void): void;
        public leave(): void;
        public remove(id: any): boolean;
    }
}
