/// <reference path="./definitions/wildemitter.d.ts" />
/// <reference path="./definitions/RTCPeerConnection.d.ts" />
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
        stream: new Pointer
    };
    private supports = Util.supports();
    private pc: RTCPeerConnection;
    public warn: Function;
    public log: Function;
    private channels = [];
    public id: string;

    constructor(id: string, options?: Object) {
        super();
        Util.overwrite(this.config, options);

        this.warn = this.config.logger.warn.bind(this.config.logger);
        this.log = this.config.logger.log.bind(this.config.logger);
        this.id = id;

        this.pc = new Util.PeerConnection(this.config.options, {
            optional: [
                {RtpDataChannels: !this.supports.sctp},
                {DtlsSrtpKeyAgreement: true}
            ]
        });
        this.pc.onnegotiationneeded = this.onNegotiationNeeded.bind(this);
        this.pc.oniceconnectionstatechange = this.onIceChange.bind(this);
        this.pc.ondatachannel = this.onDataChannel.bind(this);
        this.pc.onicecandidate = this.onCandidate.bind(this);
        this.pc.onicechange = this.onIceChange.bind(this);
    }

    private send(key: string, value: Object) {
        var payload = <Message> {
            peer: this.id,
            value: value,
            handler: [],
            key: key
        };
        this.emit("message", payload);
    }

    public parse(key: string, value: Object) {
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
        }
    }

    public sendData(label: string, payload: any): boolean {
        var channel = this.getDataChannel(label);
        if(channel && <any> channel.readyState === "open") {
            channel.send(JSON.stringify(payload));
            return true;
        }
        this.warn("Data channel named `%s` does not exists or it is not opened", label);
        return false;
    }

    public getDataChannel(label: string): RTCDataChannel {
        var result = <RTCDataChannel> {};
        this.channels.some(function(channel) {
            if(channel.label === label) {
                result = channel;
                return true;
            }
            return false;
        });
        return result;
    }

    private configDataChannel(channel: RTCDataChannel) {
        channel.onclose = (event) => {
            this.log("Channel named `%s` was closed", channel.label);
            this.emit("channelClosed", event);
        };
        channel.onerror = (event) => {
            this.warn("Channel error:", event);
            this.emit("channelError", event);
        };
        channel.onopen = (event) => {
            this.log("Channel named `%s` was opened", channel.label);
            this.emit("channelOpened", event);
        };
        channel.onmessage = (event: any) => {
            if(event.data) {
                var payload = JSON.parse(event.data);
                this.log("Getting (%s):", channel.label, payload);
                if(payload.key && payload.value) {
                    this.parse(payload.key, payload.value);
                }
                this.emit("channelMessage", payload);
            }
        };
    }

    public addDataChannel(label: string, options?: RTCDataChannelInit): RTCDataChannel {
        var channel = this.pc.createDataChannel(label, options);
        this.configDataChannel(channel);
        this.channels.push(channel);
        this.log("Data channel was added:", channel);
        if(!this.supports.negotiation) {
            this.onNegotiationNeeded();
        }
        return channel;
    }

    private onDataChannel(event: RTCDataChannelEvent) {
        if(event.channel) {
            this.configDataChannel(event.channel);
            this.channels.push(event.channel);
            this.log("Data channel was added:", event.channel)
        }
        else {
            this.warn("Data channel could not be added", event);
        }
    }

    private onIceChange() {
        this.log("Ice connection state was changed to `%s`", this.pc.iceConnectionState);
        switch(<any> this.pc.iceConnectionState) {
            case "disconnected":
            case "failed":
                this.warn("Ice connection state is disconnected, closing the peer:", this);
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

    private onCandidate(event: RTCIceCandidateEvent) {
        if(event.candidate) {
            this.log("Candidate was found:", event.candidate);
            this.send("candidate", event.candidate);
            this.pc.onicecandidate = Util.noop;
        }
        else {
            this.log("End of candidates", event);
        }
    }

    private handleCandidate(ice: RTCIceCandidate) {
        if(ice.candidate && ice.sdpMid && Util.isNumber(ice.sdpMLineIndex)) {
            this.log("Handling received candidate:", ice);
            this.pc.addIceCandidate(new Util.IceCandidate(ice));
        }
        else {
            this.warn("Candidate could not be handled:", ice)
        }
    }

    private onNegotiationNeeded() {
        this.log("Negotiation is needed");
        if(<any> this.pc.signalingState === "stable") {
            this.offer();
        }
        else {
            this.warn("Signaling state is not stable");
        }
    }

    private offer() {
        this.log("Creating an offer");
        this.pc.createOffer(
            (offer) => {
                this.pc.setLocalDescription(offer,
                    () => {
                        this.send("offer", offer);
                        this.log("Offer created:", offer);
                    },
                    (error) => {
                        this.warn(error);
                    }
                );
            },
            (error) => {
                this.warn(error);
            },
            this.config.media
        );
    }

    private answer(offer: RTCSessionDescription) {
        this.log("Answering for an offer:", offer);
        this.pc.setRemoteDescription(new Util.SessionDescription(offer),
            () => {
                this.pc.createAnswer(
                    (answer) => {
                        this.pc.setLocalDescription(answer,
                            () => {
                                this.send("answer", answer);
                            },
                            (error) => {
                                this.warn(error);
                            }
                        );
                    },
                    (error) => {
                        this.warn(error);
                    },
                    this.config.media
                );
            },
            (error) => {
                this.warn(error);
            }
        );
    }

    private handleAnswer(answer: RTCSessionDescription) {
        this.log("Handling an answer:", answer);
        this.pc.setRemoteDescription(new Util.SessionDescription(answer),
            () => {
                this.log("Answer was handled successfully");
            },
            (error) => {
                this.warn(error);
            }
        );
    }
}

export = Peer;