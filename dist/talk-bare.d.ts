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
        public handlers: any[];
        public config: {};
        public peers: any[];
        public id: string;
        constructor(id?: any, options?: Object);
        private createHandler(id, H?);
        public h(id: any, H?: typeof Handler): Handler;
        public add(id: string, P?: typeof Peer): Peer;
        public get(id: string): Peer;
        public find(props?: any, cb?: any): Peer[];
    }
}
declare module Talk {
    interface Packet {
        chunk: string;
        sum: string;
        id: string;
        c: number;
        n: number;
    }
    interface Message {
        handler: any[];
        peer: string;
        key: string;
        value: any;
    }
    interface Logger {
        warn: (...args: any[]) => void;
        log: (...args: any[]) => void;
    }
    var PeerConnection: any;
    var SessionDescription: any;
    var IceCandidate: any;
    var MediaStream: any;
    var userMedia: any;
    var debug: typeof noop;
    var warn: typeof noop;
    var log: typeof noop;
    var sctp: any;
    var negotiations: boolean;
    function logger(obj: Logger): void;
    function getUserMedia(audio?: boolean, video?: boolean, cb?: (error: any, stream?: MediaStream) => void): MediaStream;
    function attachMediaStream(element: HTMLVideoElement, stream: MediaStream): HTMLVideoElement;
    function dataURLtoBlob(dataURL: any): Blob;
    function safeCb(obj: any): any;
    function safeStr(obj: any): string;
    function safeText(obj: string): string;
    function isFunc(obj: any): boolean;
    function isEmpty(obj: any): boolean;
    function isStr(obj: any): boolean;
    function isObj(obj: any): boolean;
    function isNum(obj: any): boolean;
    function randNum(min?: number, max?: number): number;
    function randWord(length?: number): string;
    function md5(obj: string): string;
    function find(list: any[], obj: any): boolean;
    function extend(obj: Object, source: Object): Object;
    function clone(obj: any): any;
    function comp(obj1: Object, obj2: Object): boolean;
    function noop(...args: any[]): void;
}
declare module Talk {
    class Peer extends WildEmitter {
        public config: {
            settings: {
                iceServers: {
                    "url": string;
                }[];
            };
            constraints: {
                optional: {}[];
            };
            media: {
                mandatory: {
                    OfferToReceiveAudio: boolean;
                    OfferToReceiveVideo: boolean;
                };
            };
            serverDataChannel: boolean;
            newMediaStream: boolean;
            negotiate: boolean;
            chunkSize: number;
        };
        public remoteStream: MediaStream;
        public localStream: MediaStream;
        private pc;
        private channels;
        private chunks;
        public id: string;
        constructor(id: string, options?: Object);
        private sendMessage(key, value);
        public parseMessage(key: string, value: any): boolean;
        private onConnectionChange();
        private onCandidate(event);
        private handleCandidate(ice);
        private negotiate();
        public offer(): void;
        private answer(offer);
        private handleAnswer(answer);
        public close(): void;
        public sendData(payload: any, label?: string): void;
        private sendPacket(id, c, n, label?);
        private handlePacket(packet, label?);
        private endOfPackets(id, n, label?);
        private deleteChunks(id);
        private getDataChannel(label);
        private initDataChannel(channel);
        public addDataChannel(label: string, options?: RTCDataChannelInit): RTCDataChannel;
        private onDataChannel(event);
        public addStream(stream: MediaStream): void;
        private onAddStream(event);
        private onRemoveStream(event);
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
