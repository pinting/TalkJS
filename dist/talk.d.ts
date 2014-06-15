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

declare class WildEmitter {
    constructor();
    public on(event: string, group?: any, fn?: any): WildEmitter;
    public once(event: string, group?: any, fn?: any): WildEmitter;
    public releaseGroup(groupName: string): WildEmitter;
    public off(event: string, fn?: Function): WildEmitter;
    public emit(event: string, ...args: any[]): WildEmitter;
    private getWildcardCallbacks(eventName: string): any[];
}
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

// Type definitions for WebRTC
// Project: http://dev.w3.org/2011/webrtc/
// Definitions by: Ken Smith <https://github.com/smithkl42/> & Tornyi Dénes
// Definitions: https://github.com/borisyankov/DefinitelyTyped

// Definitions taken from http://dev.w3.org/2011/webrtc/editor/webrtc.html


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
// Type definitions for CryptoJS 3.1.2
// Project: https://code.google.com/p/crypto-js/
// Definitions by: Gia Bảo @ Sân Đình <https://github.com/giabao>
// Definitions: https://github.com/borisyankov/DefinitelyTyped

declare var CryptoJS: CryptoJS.CryptoJSStatic;

declare module CryptoJS{
    module lib{
        interface Base{
            extend(overrides: Object): Object
            init(...args: any[]): void
            //arguments of create() is same as init(). This is true for all subclasses
            create(...args: any[]): Base
            mixIn(properties: Object): void
            clone(): Base
        }

        interface WordArray extends Base{
            words: number[]
            sigBytes: number
            init(words?: number[], sigBytes?: number): void
            create(words?: number[], sigBytes?: number): WordArray

            init(typedArray: ArrayBuffer): void
            init(typedArray: Int8Array): void

            //Because TypeScript uses a structural type system then we don't need (& can't)
            //declare oveload function init, create for the following type (same as Int8Array):
            //then Uint8Array, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array
            //Note also: Uint8ClampedArray is not defined in lib.d.ts & not supported in IE
            //@see http://compatibility.shwups-cms.ch/en/home?&property=Uint8ClampedArray

            create(typedArray: ArrayBuffer): WordArray
            create(typedArray: Int8Array): WordArray

            toString(encoder?: enc.IEncoder): string
            concat(wordArray: WordArray): WordArray
            clamp(): void
            clone(): WordArray
            random(nBytes: number): WordArray
        }

        interface BufferedBlockAlgorithm extends Base{
            reset(): void
            clone(): BufferedBlockAlgorithm
        }

        //tparam C - Configuration type
        interface IHasher<C> extends BufferedBlockAlgorithm{
            cfg: C
            init(cfg?: C): void
            create(cfg?: C): IHasher<C>

            update(messageUpdate: WordArray): Hasher
            update(messageUpdate: string): Hasher

            finalize(messageUpdate?: WordArray): WordArray
            finalize(messageUpdate?: string): WordArray

            blockSize: number

            _createHelper(hasher: Hasher): IHasherHelper<C>
            _createHmacHelper(hasher: Hasher): IHasherHmacHelper

            clone(): IHasher<C>
        }
        interface Hasher extends IHasher<Object>{}

        //tparam C - Configuration type
        interface IHasherHelper<C>{
            (message: WordArray, cfg?: C): WordArray
            (message: string, cfg?: C): WordArray
        }
        interface HasherHelper extends IHasherHelper<Object>{}

        interface IHasherHmacHelper{
            (message: WordArray,  key: WordArray): WordArray
            (message: string,     key: WordArray): WordArray
            (message: WordArray,  key: string): WordArray
            (message: string,     key: string): WordArray
        }

        //tparam C - Configuration type
        interface ICipher<C> extends BufferedBlockAlgorithm{
            cfg: C
            createEncryptor(key: WordArray, cfg?: C): ICipher<C>
            createDecryptor(key: WordArray, cfg?: C): ICipher<C>

            create(xformMode?: number, key?: WordArray, cfg?: C): ICipher<C>
            init(xformMode?: number, key?: WordArray, cfg?: C): void

            process(dataUpdate: WordArray): WordArray
            process(dataUpdate: string): WordArray

            finalize(dataUpdate?: WordArray): WordArray
            finalize(dataUpdate?: string): WordArray

            keySize: number
            ivSize: number

            _createHelper(cipher: Cipher): ICipherHelper<C>

            clone(): ICipher<C>
        }
        interface Cipher extends ICipher<Object>{}

        interface IStreamCipher<C> extends ICipher<C>{
            drop?: number;

            createEncryptor(key: WordArray, cfg?: C): IStreamCipher<C>
            createDecryptor(key: WordArray, cfg?: C): IStreamCipher<C>

            create(xformMode?: number, key?: WordArray, cfg?: C): IStreamCipher<C>

            blockSize: number
        }
        interface StreamCipher extends IStreamCipher<Object>{}

        interface BlockCipherMode extends Base{
            createEncryptor(cipher: Cipher, iv: number[]): mode.IBlockCipherEncryptor
            createDecryptor(cipher: Cipher, iv: number[]): mode.IBlockCipherDecryptor
            init(cipher?: Cipher, iv?: number[]): void
            create(cipher?: Cipher, iv?: number[]): BlockCipherMode
        }

        //BlockCipher has interface same as IStreamCipher
        interface BlockCipher extends IStreamCipher<IBlockCipherCfg>{}

        interface IBlockCipherCfg{
            mode?: mode.IBlockCipherModeImpl //default CBC
            padding?: pad.IPaddingImpl //default Pkcs7
        }

        interface CipherParamsData{
            ciphertext?: lib.WordArray
            key?: lib.WordArray
            iv?: lib.WordArray
            salt?: lib.WordArray
            algorithm?: Cipher
            mode?: mode.IBlockCipherModeImpl
            padding?: pad.IPaddingImpl
            blockSize?: number
            formatter?: format.IFormatter
        }

        interface CipherParams extends Base, CipherParamsData{
            init(cipherParams?: CipherParamsData): void
            create(cipherParams?: CipherParamsData): CipherParams
            toString(formatter?: format.IFormatter): string
        }

        //tparam C - Configuration type
        interface ISerializableCipher<C extends ISerializableCipherCfg> extends Base{
            cfg: C
            encrypt(cipher: Cipher, message: WordArray, key: WordArray, cfg?: C): CipherParams
            encrypt(cipher: Cipher, message: string,    key: WordArray, cfg?: C): CipherParams

            decrypt(cipher: Cipher, ciphertext: CipherParamsData, key: WordArray, cfg?: C): WordArray
            decrypt(cipher: Cipher, ciphertext: string,       key: WordArray, cfg?: C): WordArray
        }

        interface SerializableCipher extends ISerializableCipher<ISerializableCipherCfg>{}
        interface ISerializableCipherCfg{
            format?: format.IFormatter //default OpenSSLFormatter
        }

        interface IPasswordBasedCipher<C extends IPasswordBasedCipherCfg> extends Base{
            cfg: C
            encrypt(cipher: Cipher, message: WordArray, password: string, cfg?: C): CipherParams
            encrypt(cipher: Cipher, message: string,    password: string, cfg?: C): CipherParams

            decrypt(cipher: Cipher, ciphertext: CipherParamsData, password: string, cfg?: C): WordArray
            decrypt(cipher: Cipher, ciphertext: string,       password: string, cfg?: C): WordArray
        }

        interface PasswordBasedCipher extends IPasswordBasedCipher<IPasswordBasedCipherCfg>{}
        interface IPasswordBasedCipherCfg extends ISerializableCipherCfg{
            kdf?: kdf.IKdfImpl //default OpenSSLKdf
        }

        /** see Cipher._createHelper */
        interface ICipherHelper<C>{
            encrypt(message: WordArray, key: WordArray, cfg?: C): CipherParams
            encrypt(message: string,    key: WordArray, cfg?: C): CipherParams
            encrypt(message: WordArray, password: string, cfg?: C): CipherParams
            encrypt(message: string,    password: string, cfg?: C): CipherParams

            decrypt(ciphertext: CipherParamsData, key: WordArray, cfg?: C): WordArray
            decrypt(ciphertext: string,       key: WordArray, cfg?: C): WordArray
            decrypt(ciphertext: CipherParamsData, password: string, cfg?: C): WordArray
            decrypt(ciphertext: string,       password: string, cfg?: C): WordArray
        }

        interface CipherHelper extends ICipherHelper<Object>{}
        interface LibStatic{
            Base: lib.Base
            WordArray: lib.WordArray
            CipherParams: lib.CipherParams
            SerializableCipher: lib.SerializableCipher
            PasswordBasedCipher: lib.PasswordBasedCipher
        }
    }

    module enc{
        interface IEncoder{
            stringify(wordArray: lib.WordArray): string
        }
        interface IDecoder{
            parse(s: string): lib.WordArray
        }
        interface ICoder extends IEncoder, IDecoder {}

        interface EncStatic{
            Hex: ICoder
            Latin1: ICoder
            Utf8: ICoder
            Base64: ICoder
            Utf16: ICoder
            Utf16BE: ICoder
            Utf16LE: ICoder
        }
    }

    module kdf{
        interface KdfStatic{
            OpenSSL: IKdfImpl
        }

        interface IKdfImpl{
            execute(password: string, keySize: number, ivSize: number, salt?: lib.WordArray): lib.CipherParams
            execute(password: string, keySize: number, ivSize: number, salt?: string): lib.CipherParams
        }
    }

    module format{
        interface FormatStatic{
            OpenSSL: IFormatter
            Hex: IFormatter
        }

        interface IFormatter{
            stringify(cipherParams: lib.CipherParamsData): string
            parse(s: string): lib.CipherParams
        }
    }

    module algo{
        interface AlgoStatic{
            AES: algo.AES
            DES: algo.DES
            TripleDES: algo.TripleDES

            RabbitLegacy: algo.RabbitLegacy
            Rabbit: algo.Rabbit
            RC4: algo.RC4

            MD5: algo.MD5
            RIPEMD160: algo.RIPEMD160
            SHA1: algo.SHA1
            SHA256: algo.SHA256
            SHA224: algo.SHA224
            SHA384: algo.SHA384
            SHA512: algo.SHA512

            SHA3: algo.SHA3

            HMAC: algo.HMAC

            EvpKDF: algo.EvpKDF
            PBKDF2: algo.PBKDF2

            RC4Drop: algo.RC4Drop
        }

        interface IBlockCipherImpl extends lib.BlockCipher{
            encryptBlock(M: number[], offset: number): void
            decryptBlock(M: number[], offset: number): void

            createEncryptor(key: lib.WordArray, cfg?: lib.IBlockCipherCfg): IBlockCipherImpl
            createDecryptor(key: lib.WordArray, cfg?: lib.IBlockCipherCfg): IBlockCipherImpl

            create(xformMode?: number, key?: lib.WordArray, cfg?: lib.IBlockCipherCfg): IBlockCipherImpl
        }

        interface AES extends IBlockCipherImpl{}
        interface DES extends IBlockCipherImpl{}
        interface TripleDES extends IBlockCipherImpl{}

        interface RabbitLegacy extends lib.StreamCipher{}
        interface Rabbit extends lib.StreamCipher{}
        interface RC4 extends lib.StreamCipher{}

        interface MD5 extends lib.Hasher{}
        interface RIPEMD160 extends lib.Hasher{}
        interface SHA1 extends lib.Hasher{}
        interface SHA256 extends lib.Hasher{}
        interface SHA224 extends lib.Hasher{}
        interface SHA384 extends lib.Hasher{}
        interface SHA512 extends lib.Hasher{}

        interface SHA3 extends lib.IHasher<ISHA3Cfg>{}
        interface ISHA3Cfg{
            outputLength?: number //default 512
        }

        interface HMAC extends lib.Base{
            init(hasher?: lib.Hasher, key?: lib.WordArray): void
            init(hasher?: lib.Hasher, key?: string): void
            create(hasher?: lib.Hasher, key?: lib.WordArray): HMAC
            create(hasher?: lib.Hasher, key?: string): HMAC

            update(messageUpdate: lib.WordArray): HMAC
            update(messageUpdate: string): HMAC

            finalize(messageUpdate?: lib.WordArray): lib.WordArray
            finalize(messageUpdate?: string): lib.WordArray
        }

        interface EvpKDF extends lib.Base{
            cfg: IEvpKDFCfg
            init(cfg?: IEvpKDFCfg): void
            create(cfg?: IEvpKDFCfg): EvpKDF
            compute(password: lib.WordArray,  salt: lib.WordArray): lib.WordArray
            compute(password: string,         salt: lib.WordArray): lib.WordArray
            compute(password: lib.WordArray,  salt: string): lib.WordArray
            compute(password: string,         salt: string): lib.WordArray
        }
        interface IEvpKDFCfg{
            keySize?: number //default 128/32
            hasher?: lib.Hasher //default MD5, or SHA1 with PBKDF2
            iterations?: number //default 1
        }
        interface IEvpKDFHelper{
            (password: lib.WordArray,  salt: lib.WordArray, cfg?: IEvpKDFCfg): lib.WordArray
            (password: string,         salt: lib.WordArray, cfg?: IEvpKDFCfg): lib.WordArray
            (password: lib.WordArray,  salt: string,        cfg?: IEvpKDFCfg): lib.WordArray
            (password: string,         salt: string,        cfg?: IEvpKDFCfg): lib.WordArray
        }

        interface PBKDF2 extends EvpKDF{} //PBKDF2 is same as EvpKDF

        interface RC4Drop extends RC4 { }
    }

    module mode{
        interface ModeStatic{
            CBC: mode.CBC
            CFB: mode.CFB
            CTR: mode.CTR
            CTRGladman: mode.CTRGladman
            ECB: mode.ECB
            OFB: mode.OFB
        }

        interface IBlockCipherEncryptor extends lib.BlockCipherMode{
            processBlock(words: number[], offset: number): void
        }
        interface IBlockCipherDecryptor extends lib.BlockCipherMode{ //exactly as IBlockCipherEncryptor
            processBlock(words: number[], offset: number): void
        }
        interface IBlockCipherModeImpl extends lib.BlockCipherMode{
            Encryptor: IBlockCipherEncryptor
            Decryptor: IBlockCipherDecryptor
        }

        interface CBC extends IBlockCipherModeImpl{}
        interface CFB extends IBlockCipherModeImpl{}
        interface CTR extends IBlockCipherModeImpl{}
        interface CTRGladman extends IBlockCipherModeImpl{}
        interface ECB extends IBlockCipherModeImpl{}
        interface OFB extends IBlockCipherModeImpl{}
    }

    module pad{
        interface PadStatic{
            Pkcs7: pad.Pkcs7
            AnsiX923: pad.AnsiX923
            Iso10126: pad.Iso10126
            Iso97971: pad.Iso97971
            ZeroPadding: pad.ZeroPadding
            NoPadding: pad.NoPadding
        }

        interface IPaddingImpl{
            pad(data: lib.WordArray, blockSize: number): void
            unpad(data: lib.WordArray): void
        }

        interface Pkcs7 extends IPaddingImpl{}
        interface AnsiX923 extends IPaddingImpl{}
        interface Iso10126 extends IPaddingImpl{}
        interface Iso97971 extends IPaddingImpl{}
        interface ZeroPadding extends IPaddingImpl{}
        interface NoPadding extends IPaddingImpl{}
    }

    module x64{
        interface X64Static{
            Word: x64.Word
            WordArray: x64.WordArray
        }

        interface Word extends lib.Base{
            high: number
            low: number

            init(high?: number, low?: number): void
            create(high?: number, low?: number): Word
        }

        interface WordArray extends lib.Base{
            words: Word[]
            sigBytes: number

            init(words?: Word[], sigBytes?: number): void
            create(words?: Word[], sigBytes?: number): WordArray
            toX32(): lib.WordArray
            clone(): WordArray
        }
    }

    interface CryptoJSStatic{
        lib: lib.LibStatic
        enc: enc.EncStatic
        kdf: kdf.KdfStatic
        format: format.FormatStatic
        algo: algo.AlgoStatic
        mode: mode.ModeStatic
        pad: pad.PadStatic
        x64: x64.X64Static

        AES: CryptoJS.lib.ICipherHelper<CryptoJS.lib.IBlockCipherCfg>
        DES: CryptoJS.lib.ICipherHelper<CryptoJS.lib.IBlockCipherCfg>
        TripleDES: CryptoJS.lib.ICipherHelper<CryptoJS.lib.IBlockCipherCfg>

        RabbitLegacy: CryptoJS.lib.CipherHelper
        Rabbit: CryptoJS.lib.CipherHelper
        RC4: CryptoJS.lib.CipherHelper
        RC4Drop: CryptoJS.lib.ICipherHelper<Object>

        MD5: CryptoJS.lib.HasherHelper
        HmacMD5: CryptoJS.lib.IHasherHmacHelper
        RIPEMD160: CryptoJS.lib.HasherHelper
        HmacRIPEMD160: CryptoJS.lib.IHasherHmacHelper
        SHA1: CryptoJS.lib.HasherHelper
        HmacSHA1: CryptoJS.lib.IHasherHmacHelper
        SHA256: CryptoJS.lib.HasherHelper
        HmacSHA256: CryptoJS.lib.IHasherHmacHelper
        SHA224: CryptoJS.lib.HasherHelper
        HmacSHA224: CryptoJS.lib.IHasherHmacHelper
        SHA512: CryptoJS.lib.HasherHelper
        HmacSHA512: CryptoJS.lib.IHasherHmacHelper
        SHA384: CryptoJS.lib.HasherHelper
        HmacSHA384: CryptoJS.lib.IHasherHmacHelper

        SHA3: CryptoJS.lib.IHasherHelper<CryptoJS.algo.ISHA3Cfg>
        HmacSHA3: CryptoJS.lib.IHasherHmacHelper

        EvpKDF: CryptoJS.algo.IEvpKDFHelper
        PBKDF2: CryptoJS.algo.IEvpKDFHelper //PBKDF2 is same as EvpKDF
    }
}

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
