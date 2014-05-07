/// <reference path="./definitions/rtcpeerconnection.d.ts" />
/// <reference path="./definitions/wildemitter.d.ts" />
/// <reference path="./definitions/talk.d.ts" />

import WildEmitter = require("wildemitter");
import Pointer = require("./pointer");
import Util = require("./util");

class Peer extends WildEmitter {
    public config = {
        options: {
            iceServers: [
                {"url": "stun:stun.l.google.com:19302"},
                {"url": "stun:stun1.l.google.com:19302"},
                {"url": "stun:stun2.l.google.com:19302"},
                {"url": "stun:stun3.l.google.com:19302"},
                {"url": "stun:stun4.l.google.com:19302"}
            ]
        },
        media: {
            mandatory: {
                OfferToReceiveAudio: false,
                OfferToReceiveVideo: false
            }
        },
        logger: <Logger> {
            warn: Util.noop,
            log: Util.noop
        },
        supports: <Supports> null,
        localStream: new Pointer,
        negotiation: true
    };
    private pc: RTCPeerConnection;
    public stream: MediaStream;
    private supports: Supports;
    private channels = [];
    public warn: Function;
    public log: Function;
    public id: string;

    constructor(id: string, options?: Object) {
        super();
        Util.overwrite(this.config, options);

        this.warn = this.config.logger.warn.bind(this.config.logger);
        this.log = this.config.logger.log.bind(this.config.logger);
        this.supports = this.config.supports || Util.supports();
        this.id = id;

        this.pc = new Util.PeerConnection(this.config.options, {
            optional: [
                {RtpDataChannels: !this.supports.sctp},
                {DtlsSrtpKeyAgreement: true}
            ]
        });
        this.pc.oniceconnectionstatechange = this.onConnectionChange.bind(this);
        this.pc.onremovestream = this.onRemoveStream.bind(this);
        this.pc.onicechange = this.onConnectionChange.bind(this);
        this.pc.onicecandidate = this.handleCandidate.bind(this);
        this.pc.onnegotiationneeded = this.negotiate.bind(this);
        this.pc.ondatachannel = this.onDataChannel.bind(this);
        this.pc.onaddstream = this.onAddStream.bind(this);

        // Add local stream to the peer if it is initialized

        if(this.config.localStream.value) {
            this.addStream(this.config.localStream.value);
        }
        else {
            this.config.localStream.once("change", (stream) => {
                this.addStream(stream);
            });
        }
    }

    /**
     * Send message to the peer
     */

    private sendMessage(key: string, value: Object): void {
        var payload = <Message> {
            peer: this.id,
            value: value,
            handler: [],
            key: key
        };
        this.emit("message", payload);
    }

    /**
     * Parse message from the peer
     */

    public parseMessage(key: string, value: Object): boolean {
        this.log("Parsing:", key, value);
        switch(key) {
            case "offer":
                this.answer(value);
                break;
            case "answer":
                this.handleAnswer(value);
                break;
            case "candidate":
                this.handleCandidate(value);
                break;
            default:
                return false;
        }
        return true;
    }

    /**
     * Add our stream to the peer
     */

    public addStream(stream: MediaStream): void {
        this.pc.addStream(stream, this.config.media);
        this.log("Stream was added:", stream);
        if(!this.supports.negotiation) {
            this.negotiate();
        }
    }

    /**
     * When the peer adds its stream to us
     */

    private onAddStream(event: RTCMediaStreamEvent): void {
        if(event.stream) {
            this.log("Remote stream was added:", event.stream);
            this.stream = event.stream;
            this.emit("streamAdded", this);
        }
        else {
            this.warn("Remote stream could not be added:", event);
        }
    }

    /**
     * When the added stream is removed
     */

    private onRemoveStream(event: RTCMediaStreamEvent): void {
        this.stream = <MediaStream> {};
        this.emit("streamRemoved", this);
        this.log("Remote stream was removed from peer:", event);
    }

    /**
     * Send data directly to the peer
     */

    public send(label: string, payload: any): boolean {
        var channel = this.getDataChannel(label);
        if(channel && <any> channel.readyState === "open") {
            channel.send(JSON.stringify(payload));
            return true;
        }
        this.warn("Data channel named `%s` does not exists or it is not opened", label);
        return false;
    }

    /**
     * Get a data channel
     */

    private getDataChannel(label: string): RTCDataChannel {
        var result = <any> false;
        this.channels.some(function(channel: RTCDataChannel) {
            if(channel.label === label) {
                result = channel;
                return true;
            }
            return false;
        });
        return result;
    }

    /**
     * Configuration a newly created data channel
     */

    private configDataChannel(channel: RTCDataChannel): void {
        channel.onclose = (event) => {
            this.log("Channel named `%s` was closed", channel.label);
            this.emit("channelClosed", this, event);
        };
        channel.onerror = (event) => {
            this.warn("Channel error:", event);
            this.emit("channelError", this, event);
        };
        channel.onopen = (event) => {
            this.log("Channel named `%s` was opened", channel.label);
            this.emit("channelOpened", this, event);
        };
        channel.onmessage = (event: any) => {
            if(event.data) {
                var payload = JSON.parse(event.data);
                this.log("Getting (%s):", channel.label, payload);
                this.emit("channelMessage", this, payload);
            }
        };
    }

    /**
     * Add a data channel
     */

    public addDataChannel(label: string, options?: RTCDataChannelInit): RTCDataChannel {
        var channel = this.pc.createDataChannel(label, options);
        this.configDataChannel(channel);
        this.channels.push(channel);
        this.log("Data channel was added:", channel);
        if(!this.supports.negotiation) {
            this.negotiate();
        }
        return channel;
    }

    /**
     * When the peer has added a data channel between us
     */

    private onDataChannel(event: RTCDataChannelEvent): void {
        if(event.channel) {
            this.configDataChannel(event.channel);
            this.channels.push(event.channel);
            this.log("Data channel was added:", event.channel)
        }
        else {
            this.warn("Data channel could not be added", event);
        }
    }

    /**
     * When the connection state has changed
     */

    private onConnectionChange(): void {
        this.log("Ice connection state was changed to `%s`", this.pc.iceConnectionState);
        switch(<any> this.pc.iceConnectionState) {
            case "disconnected":
            case "failed":
                this.warn("Ice connection state is disconnected, closing the peer");
                this.pc.close();
                break;
            case "completed":
            case "closed":
                this.pc.onicecandidate = Util.noop;
                break;
            default:
                this.pc.onicecandidate = this.onCandidate.bind(this);
                break;
        }
    }

    /**
     * When we found an ice candidate
     */

    private onCandidate(event: RTCIceCandidateEvent): void {
        if(event.candidate) {
            this.log("Candidate was found:", event.candidate);
            this.sendMessage("candidate", event.candidate);
            this.pc.onicecandidate = Util.noop;
        }
        else {
            this.log("End of candidates", event);
        }
    }

    /**
     * Handle a received ice candidate, through a message
     */

    private handleCandidate(ice: RTCIceCandidate): void {
        if(ice.candidate && ice.sdpMid && Util.isNumber(ice.sdpMLineIndex)) {
            this.log("Handling received candidate:", ice);
            this.pc.addIceCandidate(new Util.IceCandidate(ice));
        }
        else {
            this.warn("Candidate could not be handled:", ice)
        }
    }

    /**
     * Negotiate with the peer
     */

    private negotiate(): void {
        this.log("Negotiation is needed");
        if(this.config.negotiation) {
            if(<any> this.pc.signalingState === "stable") {
                this.offer();
            }
            else {
                this.warn("Signaling state is not stable");
            }
        }
    }

    /**
     * Create an offer towards the peer
     */

    public offer(): void {
        this.log("Creating an offer");
        this.pc.createOffer(
            (offer: RTCSessionDescription) => {
                this.pc.setLocalDescription(offer,
                    () => {
                        this.sendMessage("offer", offer);
                        this.log("Offer created:", offer);
                    },
                    (error: string) => {
                        this.warn(error);
                    }
                );
            },
            (error: string) => {
                this.warn(error);
            },
            this.config.media
        );
    }

    /**
     * Answer for a offer of the peer
     */

    private answer(offer: RTCSessionDescription): void {
        this.log("Answering for an offer:", offer);
        this.pc.setRemoteDescription(new Util.SessionDescription(offer),
            () => {
                this.pc.createAnswer(
                    (answer: RTCSessionDescription) => {
                        this.pc.setLocalDescription(answer,
                            () => {
                                this.sendMessage("answer", answer);
                            },
                            (error: string) => {
                                this.warn(error);
                            }
                        );
                    },
                    (error: string) => {
                        this.warn(error);
                    },
                    this.config.media
                );
            },
            (error: string) => {
                this.warn(error);
            }
        );
    }

    /**
     * Handle the answer of the peer
     */

    private handleAnswer(answer: RTCSessionDescription): void {
        this.log("Handling an answer:", answer);
        this.pc.setRemoteDescription(new Util.SessionDescription(answer),
            () => {
                this.log("Answer was handled successfully");
            },
            (error: string) => {
                this.warn(error);
            }
        );
    }
}

export = Peer;