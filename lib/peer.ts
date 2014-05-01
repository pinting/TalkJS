/// <reference path="./webrtc/RTCPeerConnection.d.ts" />
/// <reference path="./wildemitter.d.ts" />
/// <reference path="./talk.d.ts" />

import WildEmitter = require("wildemitter");
import Pointer = require("./pointer");
import Shims = require("./shims");
import Util = require("./util");

class Peer extends WildEmitter {
    public config = {
        server: {
            iceServers: [
                {"url": "stun:stun.l.google.com:19302"},
                {"url": "stun:stun1.l.google.com:19302"},
                {"url": "stun:stun2.l.google.com:19302"},
                {"url": "stun:stun3.l.google.com:19302"},
                {"url": "stun:stun4.l.google.com:19302"}
            ]
        },
        options: {
            optional: [
                {DtlsSrtpKeyAgreement: true},
                {RtpDataChannels: true}
            ]
        },
        constraints: {
            mandatory: {
                OfferToReceiveAudio: true,
                OfferToReceiveVideo: true
            }
        },
        logger: <Logger> {
            warn: Util.noop,
            log: Util.noop
        },
        stream: new Pointer
    };
    private pc: RTCPeerConnection;
    public warn = Util.noop;
    public log = Util.noop;
    private channels = [];

    constructor(options?: Object) {
        super();
        Util.extend(this.config, options);

        if(this.config.logger && this.config.logger.log && this.config.logger.warn) {
            this.warn = this.config.logger.warn.bind(this.config.logger);
            this.log = this.config.logger.log.bind(this.config.logger);
        }

        this.pc = new Shims.PeerConnection(this.config.server, this.config.options);
        this.pc.onnegotiationneeded = this.onNegotiationNeeded.bind(this);
        this.pc.oniceconnectionstatechange = this.onIceChange.bind(this);
        this.pc.ondatachannel = this.onDataChannel.bind(this);
        this.pc.onicecandidate = this.onCandidate.bind(this);
        this.pc.onicechange = this.onIceChange.bind(this);

        var stream = this.config.stream.get();
        if(stream) {
            this.log("Adding local stream to peer");
            this.pc.addStream(stream);
        }
    }

    public send(key: string, value: Object) {
        this.log("Sending:", key, value);
        this.emit("message", key, value);
    }

    public get(key: string, value: string) {
        value = JSON.parse(value);
        this.log("Getting:", key, value);
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

    private onDataChannel(event: RTCDataChannelEvent) {
        if(event.channel) {
            this.channels.push(event.channel);
        }
    }

    private onIceChange() {
        switch(<any> this.pc.iceConnectionState) {
            case "disconnected":
            case "failed":
                this.warn("The iceConnectionState is disconnected, closing the peer:", this);
                this.pc.close();
                break;
            case "completed":
                this.pc.onicecandidate = Util.noop;
                break;
        }
    }

    private onCandidate(event: RTCIceCandidateEvent) {
        if(event.candidate) {
            this.log("Found candidate:", event.candidate);
            this.send("candidate", event.candidate);
            this.pc.onicecandidate = Util.noop;
        }
    }

    private handleCandidate(ice: RTCIceCandidate) {
        if(ice.sdpMLineIndex && ice.candidate) {
            this.log("Handling received candidate:", ice);
            this.pc.addIceCandidate(new Shims.IceCandidate(ice));
        }
    }

    private onNegotiationNeeded() {
        this.log("'negotiationneeded' triggered!");
        if(<any> this.pc.signalingState === "stable") {
            this.offer();
        }
        else {
            this.warn("Signaling state is not stable!");
        }
    }

    public offer() {
        this.log("Making an offer");
        this.pc.createOffer(
            (offer) => {
                this.pc.setLocalDescription(offer,
                    () => {
                        this.send("offer", offer);
                    },
                    (error) => {
                        this.warn(error);
                    }
                );
            },
            (error) => {
                this.warn(error);
            },
            this.config.constraints
        );
    }

    public answer(offer: RTCSessionDescription) {
        this.log("Answering an offer");
        this.pc.setRemoteDescription(new Shims.SessionDescription(offer),
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
                    this.config.constraints
                );
            },
            (error) => {
                this.warn(error);
            }
        );
    }

    private handleAnswer(answer: RTCSessionDescription) {
        this.pc.setRemoteDescription(new Shims.SessionDescription(answer),
            () => {
                this.log("Answer handled successfully");
            },
            (error) => {
                this.warn(error);
            }
        );
    }
}

export = Peer;