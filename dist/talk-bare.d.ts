/// <reference path="../src/definitions/socket.io-client.d.ts" />
/// <reference path="../src/definitions/wildemitter.d.ts" />
/// <reference path="../src/definitions/mediastream.d.ts" />
/// <reference path="../src/definitions/rtcpeerconnection.d.ts" />
/// <reference path="../src/definitions/crypto.d.ts" />
declare module Talk {
    class Connection extends WildEmitter {
        public server: io.Socket;
        public handler: Handler;
        public warn: Function;
        public log: Function;
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
            logger: Logger;
            localStream: Pointer;
            handler: typeof Handler;
            supports: any;
            peer: typeof Peer;
        };
        public localStream: MediaStream;
        public warn: Function;
        public log: Function;
        public handlers: any[];
        public _peers: any[];
        public id: string;
        constructor(id?: any, options?: Object);
        public getUserMedia(audio?: boolean, video?: boolean): MediaStream;
        private createHandler(id, H?);
        public h(id: any, H?: Object): Handler;
        public add(id: string): Peer;
        public get(id: string): Peer;
        public peers(args?: any, cb?: any): Peer[];
    }
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
            logger: Logger;
            supports: Supports;
            negotiate: boolean;
        };
        private pc;
        public remoteStream: MediaStream;
        public localStream: MediaStream;
        private supports;
        private channels;
        public warn: Function;
        public log: Function;
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
    interface Logger {
        warn: (...args: any[]) => void;
        log: (...args: any[]) => void;
    }
    interface Message {
        handler: any[];
        peer: string;
        key: string;
        value: any;
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
        constructor(handler: Handler, host?: string, onOffer?: (...args: any[]) => void, onAnswer?: any);
        public get(payload: Message): void;
        public join(room: string, type: string, cb: (error: any, clients: any[]) => void): void;
        public leave(): void;
        public remove(id: any): boolean;
    }
}
declare module Talk {
    class Util {
        static PeerConnection: any;
        static SessionDescription: any;
        static IceCandidate: any;
        static MediaStream: any;
        static getUserMedia(...args: any[]): void;
        static attachMediaStream(element: HTMLVideoElement, stream: MediaStream): HTMLVideoElement;
        static safeCb(obj: any): Function;
        static safeStr(obj: any): string;
        static safeText(obj: any): string;
        static isEmpty(obj: any): boolean;
        static isString(obj: any): boolean;
        static isObject(obj: any): boolean;
        static isNumber(obj: any): boolean;
        static randNum(min?: number, max?: number): number;
        static randWord(length?: number): string;
        static sha256(obj: string): string;
        static find(list: any[], obj: any): boolean;
        static extend(obj: Object, source: Object): Object;
        static overwrite(obj: Object, source: Object): Object;
        static clone(obj: any): any;
        static comp(obj1: Object, obj2: Object): boolean;
        static supports(config?: Object): Supports;
        static noop(...args: any[]): void;
    }
    interface Supports {
        negotiation: boolean;
        media: boolean;
        blob: boolean;
        sctp: boolean;
        data: boolean;
    }
}
