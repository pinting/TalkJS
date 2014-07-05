// Type definitions for socket.io nodejs client
// Project: http://socket.io/
// Definitions by: Maido Kaara <https://github.com/v3rm0n> & Tornyi Dénes
// Definitions: https://github.com/borisyankov/DefinitelyTyped

declare module io {
    export function connect(host: string, details?: any): Socket;

    interface EventEmitter {
        emit(name: string, ...data: any[]): any;
        on(ns: string, fn: Function): EventEmitter;
        addListener(ns: string, fn: Function): EventEmitter;
        removeListener(ns: string, fn: Function): EventEmitter;
        removeAllListeners(ns: string): EventEmitter;
        once(ns: string, fn: Function): EventEmitter;
        listeners(ns: string): Function[];
    }

    interface SocketNamespace extends EventEmitter {
        of(name: string): SocketNamespace;
        send(data: any, fn: Function): SocketNamespace;
        emit(name: string): SocketNamespace;
    }

    interface Socket extends EventEmitter {
        of(name: string): SocketNamespace;
        connect(fn: Function): Socket;
        packet(data: any): Socket;
        flushBuffer(): void;
        disconnect(): Socket;
        socket: Socket;
        sessionid: string;
    }
}

// Type definitions for WebRTC
// Project: http://dev.w3.org/2011/webrtc/
// Definitions by: Ken Smith <https://github.com/smithkl42/> & Tornyi Dénes
// Definitions: https://github.com/borisyankov/DefinitelyTyped

// Definitions taken from http://dev.w3.org/2011/webrtc/editor/webrtc.html

// Type definitions for WebRTC
// Project: http://dev.w3.org/2011/webrtc/
// Definitions by: Ken Smith <https://github.com/smithkl42/> & Tornyi Dénes
// Definitions: https://github.com/borisyankov/DefinitelyTyped

// Taken from http://dev.w3.org/2011/webrtc/editor/getusermedia.html

interface MediaStreamConstraints {
	audio: boolean;
	video: boolean;
}
declare var MediaStreamConstraints: {
	prototype: MediaStreamConstraints;
	new (): MediaStreamConstraints;
}

interface MediaTrackConstraints {
	mandatory: MediaTrackConstraintSet;
	optional: MediaTrackConstraint[];
}
declare var MediaTrackConstraints: {
	prototype: MediaTrackConstraints;
	new (): MediaTrackConstraints;
}

// ks - Not defined in the source doc.
interface MediaTrackConstraintSet {
}
declare var MediaTrackConstraintSet: {
	prototype: MediaTrackConstraintSet;
	new (): MediaTrackConstraintSet;
}

// ks - Not defined in the source doc.
interface MediaTrackConstraint {
}
declare var MediaTrackConstraint: {
	prototype: MediaTrackConstraint;
	new (): MediaTrackConstraints;
}

interface Navigator {
	getUserMedia(constraints: MediaStreamConstraints, successCallback: (stream: any) => void , errorCallback: (error: Error) => void );
	webkitGetUserMedia(constraints: MediaStreamConstraints, successCallback: (stream: any) => void , errorCallback: (error: Error) => void );
}

interface EventHandler { (event: Event): void; }

interface NavigatorUserMediaSuccessCallback { (stream: LocalMediaStream): void; }

interface NavigatorUserMediaError {
	PERMISSION_DENIED: number; // = 1;
	code: number;
}
declare var NavigatorUserMediaError: {
	prototype: NavigatorUserMediaError;
	new (): NavigatorUserMediaError;
	PERMISSION_DENIED: number; // = 1;
}

interface NavigatorUserMediaErrorCallback { (error: NavigatorUserMediaError): void; }

interface MediaStreamTrackList {
	length: number;
	item: MediaStreamTrack;
	add(track: MediaStreamTrack): void;
	remove(track: MediaStreamTrack): void;
	onaddtrack: (event: Event) => void;
	onremovetrack: (event: Event) => void;
    forEach: (track: any) => void;
}
declare var MediaStreamTrackList: {
	prototype: MediaStreamTrackList;
	new (): MediaStreamTrackList;
}
declare var webkitMediaStreamTrackList: {
	prototype: MediaStreamTrackList;
	new (): MediaStreamTrackList;
}

interface MediaStream {
	label: string;
	getAudioTracks(): MediaStreamTrackList;
	getVideoTracks(): MediaStreamTrackList;
	ended: boolean;
	onended: (event: Event) => void;
}
declare var MediaStream: {
	prototype: MediaStream;
	new (): MediaStream;
	new (trackContainers: MediaStream[]): MediaStream;
	new (trackContainers: MediaStreamTrackList[]): MediaStream;
	new (trackContainers: MediaStreamTrack[]): MediaStream;
}
declare var webkitMediaStream: {
	prototype: MediaStream;
	new (): MediaStream;
	new (trackContainers: MediaStream[]): MediaStream;
	new (trackContainers: MediaStreamTrackList[]): MediaStream;
	new (trackContainers: MediaStreamTrack[]): MediaStream;
}

interface LocalMediaStream extends MediaStream {
	stop(): void;
}

interface MediaStreamTrack {
	kind: string;
	label: string;
	enabled: boolean;
	LIVE: number; // = 0;
	MUTED: number; // = 1;
	ENDED: number; // = 2;
	readyState: number;
	onmute: (event: Event) => void;
	onunmute: (event: Event) => void;
	onended: (event: Event) => void;
}
declare var MediaStramTrack: {
	prototype: MediaStreamTrack;
	new (): MediaStreamTrack;
	LIVE: number; // = 0;
	MUTED: number; // = 1;
	ENDED: number; // = 2;
}

interface streamURL extends URL {
	createObjectURL(stream: MediaStream): string;
}
//declare var URL: {
//	prototype: MediaStreamTrack;
//	new (): URL;
//	createObjectURL(stream: MediaStream): string;
//}

interface WebkitURL extends streamURL {
}
declare var webkitURL: {
	prototype: WebkitURL;
    new (): streamURL;
	createObjectURL(stream: MediaStream): string;
}


interface RTCConfiguration {
    iceServers: RTCIceServer[];
}
declare var RTCConfiguration: {
    prototype: RTCConfiguration;
    new (): RTCConfiguration;
}

interface RTCIceServer {
    url: string;
    credential?: string;
}
declare var RTCIceServer: {
    prototype: RTCIceServer;
    new (): RTCIceServer;
}

interface webkitRTCPeerConnection extends RTCPeerConnection {
}
declare var webkitRTCPeerConnection: {
    prototype: webkitRTCPeerConnection;
    new (settings: RTCPeerConnectionConfig, constraints?:MediaConstraints): webkitRTCPeerConnection;
}

interface IceState {
}
declare var IceState: {
    prototype: IceState;
    new (): IceState;
}

// ks 12/20/12 - There's more here that doesn't seem to be documented very well yet.
interface MediaConstraints {
    mandatory: MediaOfferConstraints;
}

interface MediaOfferConstraints {
    OfferToReceiveAudio: boolean;
    OfferToReceiveVideo: boolean;
}

interface RTCSessionDescription {
    type?: RTCSdpType;
    sdp?: string;
}
declare var RTCSessionDescription: {
    prototype: RTCSessionDescription;
    new (descriptionInitDict?: RTCSessionDescriptionInit): RTCSessionDescription;
}

interface RTCSessionDescriptionInit {
    type: RTCSdpType;
    sdp: string;
}
declare var RTCSessionDescriptionInit: {
    prototype: RTCSessionDescriptionInit;
    new (): RTCSessionDescriptionInit;
}

interface SdpType {
}

interface RTCPeerState {
}

interface RTCDataChannelInit {
    reliable: boolean;
}

declare enum RTCSdpType {
    offer,
    pranswer,
    answer
}

declare enum RTCDataChannelState {
    connecting,
    open,
    closing,
    closed
}

interface RTCDataChannel extends EventTarget {
    label: string;
    reliable: boolean;
    readyState: RTCDataChannelState;
    bufferedAmount: number;
    onopen: (event: Event)=> void;
    onerror: (event: Event)=> void;
    onclose: (event: Event)=> void;
    close(): void;
    onmessage: (event: Event)=> void;
    binaryType: string;
    send(data: string);
    send(data: ArrayBuffer);
    send(data: Blob);
}
declare var RTCDataChannel: {
    prototype: RTCDataChannel;
    new (): RTCDataChannel;
}

interface RTCDataChannelEvent extends Event {
    constructor (eventInitDict: RTCDataChannelEventInit);
    channel: RTCDataChannel;
}
declare var RTCDataChannelEvent: {
    prototype: RTCDataChannelEvent;
    new (eventInitDict: RTCDataChannelEventInit);
}

interface RTCIceCandidateEvent extends Event{
    candidate: RTCIceCandidate;
}

interface RTCMediaStreamEvent extends Event {
    stream: MediaStream;
}

interface EventInit {
}

interface RTCDataChannelEventInit extends EventInit {
    channel: RTCDataChannel;
}

interface RTCVoidCallback {
    (): void;
}
interface RTCSessionDescriptionCallback {
    (sdp: RTCSessionDescription): void;
}
interface RTCPeerConnectionErrorCallback {
    (errorInformation: string): void;
}

/** This should be an enum */
interface RTCIceGatheringState {
    string;
}

/** This should be an enum */
interface RTCIceConnectionState {
    string;
}

/** This should be an enum */
interface RTCSignalingState{
    string;
}

interface RTCPeerConnection {
    createOffer(successCallback: RTCSessionDescriptionCallback, failureCallback?: RTCPeerConnectionErrorCallback, constraints?: MediaConstraints): void;
    createAnswer(successCallback: RTCSessionDescriptionCallback, failureCallback?: RTCPeerConnectionErrorCallback, constraints?: MediaConstraints): void;
    setLocalDescription(description: RTCSessionDescription, successCallback?: RTCVoidCallback, failureCallback?: RTCPeerConnectionErrorCallback): void;
    localDescription: RTCSessionDescription;
    setRemoteDescription(description: RTCSessionDescription, successCallback?: RTCVoidCallback, failureCallback?: RTCPeerConnectionErrorCallback): void;
    remoteDescription: RTCSessionDescription;
    signalingState: RTCSignalingState;
    updateIce(configuration?: RTCConfiguration, constraints?: MediaConstraints): void;
    addIceCandidate(candidate: RTCIceCandidate): void;
    iceGatheringState: RTCIceGatheringState;
    iceConnectionState: RTCIceConnectionState;
    getLocalStreams(): MediaStream[];
    getRemoteStreams(): MediaStream[];
    createDataChannel(label?: string, dataChannelDict?: RTCDataChannelInit): RTCDataChannel;
    ondatachannel: (event: Event)=> void;
    addStream(stream: MediaStream, constraints?: MediaConstraints): void;
    removeStream(stream: MediaStream): void;
    close(): void;
    onnegotiationneeded: (event: Event)=> void;
    onconnecting: (event: Event)=> void;
    onopen: (event: Event)=> void;
    onaddstream: (event: RTCMediaStreamEvent)=> void;
    onremovestream: (event: RTCMediaStreamEvent)=> void;
    onstatechange: (event: Event)=> void;
    oniceconnectionstatechange: (event: Event)=> void;
    onicechange: (event: Event)=> void;
    onicecandidate: (event: RTCIceCandidateEvent)=> void;
    onidentityresult: (event: Event)=> void;
}
declare var RTCPeerConnection: {
    prototype: RTCPeerConnection;
    new (configuration: RTCConfiguration, constraints?: MediaConstraints): RTCPeerConnection;
}

interface RTCIceCandidate {
    candidate?: string;
    sdpMid?: string;
    sdpMLineIndex?: number;
}
declare var RTCIceCandidate: {
    prototype: RTCIceCandidate;
    new (candidateInitDict?: RTCIceCandidate);
}

interface RTCIceCandidateInit {
    candidate: string;
    sdpMid: string;
    sdpMLineIndex: number;
}
declare var RTCIceCandidateInit:{
    prototype: RTCIceCandidateInit;
    new (): RTCIceCandidateInit;
}

interface PeerConnectionIceEvent {
    peer: RTCPeerConnection;
    candidate: RTCIceCandidate;
}
declare var PeerConnectionIceEvent: {
    prototype: PeerConnectionIceEvent;
    new (): PeerConnectionIceEvent;
}

interface RTCPeerConnectionConfig {
    iceServers: RTCIceServer[];
}
declare var RTCPeerConnectionConfig: {
    prototype: RTCPeerConnectionConfig;
    new (): RTCPeerConnectionConfig;
}
declare class WildEmitter {
    constructor();
    public on(event: string, group?: any, fn?: any): WildEmitter;
    public once(event: string, group?: any, fn?: any): WildEmitter;
    public releaseGroup(groupName: string): WildEmitter;
    public off(event: string, fn?: Function): WildEmitter;
    public emit(event: string, ...args: any[]): WildEmitter;
    private getWildcardCallbacks(eventName: string): any[];
}
interface Navigator {
    mozGetUserMedia: any;
}
interface Window {
    mozRTCSessionDescription: any;
    webkitRTCPeerConnection: any;
    RTCSessionDescription: any;
    mozRTCPeerConnection: any;
    mozRTCIceCandidate: any;
    webkitMediaStream: any;
    RTCPeerConnection: any;
    RTCIceCandidate: any;
    MediaStream: any;
    webkitURL: any;
    URL: any;
}
declare module Talk.Connection {
    class Pure extends WildEmitter {
        public handler: Handler;
        public id: string;
        public send(payload: IMessage): void;
        public get(payload: IMessage): void;
        public connectionReady(id: string): void;
        public findHandler(handler: string[]): Handler;
    }
}
declare module Talk.Connection {
    class Room extends Pure {
        public onAnswer: (peer: Peer) => void;
        public onOffer: (peer: Peer) => void;
        public type: string;
        public room: string;
        public join(room: string, type: string, cb?: (error: any, clients: any[]) => void): void;
        public leave(): void;
        public get(payload: IMessage): void;
        public remove(id: any): boolean;
    }
}
declare module Talk.Connection.SocketIO {
    class Pure extends Connection.Pure {
        public server: io.Socket;
        constructor(handler: Handler, host?: string);
        public send(payload: IMessage): void;
    }
}
declare module Talk.Connection.SocketIO {
    class Room extends Connection.Room {
        public server: io.Socket;
        constructor(handler: Handler, host?: string, onOffer?: typeof noop, onAnswer?: any);
        public send(payload: IMessage): void;
        public join(room: string, type: string, cb?: (error: any, clients: any[]) => void): void;
        public leave(): void;
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
    interface ILogger {
        warn: (...args: any[]) => void;
        log: (...args: any[]) => void;
    }
}
declare module Talk {
    interface IMessage {
        handler: string[];
        peer: string;
        key: string;
        value: any;
    }
}
declare module Talk {
    var PeerConnection: any;
    var SessionDescription: any;
    var IceCandidate: any;
    var MediaStream: any;
    var URL: any;
    var userMedia: LocalMediaStream;
    var warn: typeof noop;
    var log: typeof noop;
    var sctp: any;
    var negotiations: boolean;
    function logger(obj: ILogger): void;
    function getUserMedia(audio?: boolean, video?: boolean, cb?: (error: any, stream?: MediaStream) => void): MediaStream;
    function attachMediaStream(element: HTMLVideoElement, stream: MediaStream): HTMLVideoElement;
    function dataURLtoBlob(dataURL: any): Blob;
    function safeCb(obj: any): any;
    function safeStr(obj: any): string;
    function isFunc(obj: any): boolean;
    function isEmpty(obj: any): boolean;
    function isStr(obj: any): boolean;
    function isObj(obj: any): boolean;
    function isNum(obj: any): boolean;
    function randNum(min?: number, max?: number): number;
    function randWord(length?: number): string;
    function roundUp(x: number): number;
    function uuid(): string;
    function extend(obj: Object, source: Object): Object;
    function clone(obj: any): any;
    function comp(obj1: Object, obj2: Object): boolean;
    function noop(...args: any[]): void;
}
declare module Talk.Packet.String {
    interface IMessage {
        key: string;
        value: any;
        id: string;
    }
}
declare module Talk.Packet.String {
    interface IPacket {
        payload: string;
        length: number;
        index: number;
    }
}
declare module Talk.Packet.String {
    class Manager extends WildEmitter {
        private packers;
        constructor(target: any);
        public send(peer: Peer, label: string, payload: string): Packer;
        private add(peer, label, id?);
        private clean(packer);
        private get(label, id);
    }
}
declare module Talk.Packet.String {
    class Packer extends WildEmitter {
        private packets;
        private length;
        public label: string;
        private peer;
        public id: string;
        constructor(peer: Peer, label: string, id?: string);
        public parse(key: string, value?: any): void;
        private send(key, value?);
        private get(i);
        public chunk(buffer: any, size?: number): void;
        public join(): void;
        public add(packet: IPacket): void;
        public ask(i: number): void;
        public clean(): void;
    }
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
            newLocalStream: boolean;
            negotiate: boolean;
        };
        public remoteStream: MediaStream;
        public localStream: MediaStream;
        private pc;
        private channels;
        private packets;
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
        public sendData(label: string, payload: any): void;
        private handleData(label, payload);
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
