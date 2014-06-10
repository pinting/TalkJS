/// <reference path="./definitions/rtcpeerconnection" />
/// <reference path="./definitions/wildemitter" />

module Talk {
    export class Peer extends WildEmitter {
        public config = {
            settings: {
                iceServers: [
                    {"url": "stun:stun.l.google.com:19302"},
                    {"url": "stun:stun1.l.google.com:19302"},
                    {"url": "stun:stun2.l.google.com:19302"},
                    {"url": "stun:stun3.l.google.com:19302"},
                    {"url": "stun:stun4.l.google.com:19302"}
                ]
            },
            constraints: {
                optional: [
                    {DtlsSrtpKeyAgreement: true},
                    {RtpDataChannels: !sctp}
                ]
            },
            media: {
                mandatory: {
                    OfferToReceiveAudio: false,
                    OfferToReceiveVideo: false
                }
            },
            serverDataChannel: true,
            newMediaStream: false,
            negotiate: false,
            chunkSize: 1200
        };
        public remoteStream: MediaStream;
        public localStream: MediaStream;
        private pc: RTCPeerConnection;
        private channels = [];
        private chunks = {};
        public id: string;

        /**
         * A peer symbolizes another user and its connection. We can use
         * any kind of messaging service to sync a peer object with
         * the actual user.
         * @param {string} id - An unique ID
         * @param {Talk.Peer.config} [options]
         */

        constructor(id: string, options?: Object) {
            super();

            extend(this.config, options);
            this.id = id;

            this.pc = new PeerConnection(this.config.settings, this.config.constraints);
            this.pc.oniceconnectionstatechange = this.onConnectionChange.bind(this);
            this.pc.onicechange = this.onConnectionChange.bind(this);
            this.pc.onnegotiationneeded = this.negotiate.bind(this);
            this.pc.onremovestream = this.onRemoveStream.bind(this);
            this.pc.ondatachannel = this.onDataChannel.bind(this);
            this.pc.onicecandidate = this.onCandidate.bind(this);
            this.pc.onaddstream = this.onAddStream.bind(this);
        }

        /**
         * Send message to the peer
         * @param {string} key - Key of the message
         * @param {*} value
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
         * @param {string} key
         * @param {*} value
         * @returns {boolean}
         */

        public parseMessage(key: string, value: Object): boolean {
            log("Parsing:", key, value);
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
                case "data":
                    this.handleData(<Packet> value);
                    break;
                default:
                    return false;
            }
            return true;
        }

        /**
         * Add our stream to the peer
         * @param {MediaStream} stream
         */

        public addStream(stream: MediaStream): void {
            if(stream.getVideoTracks().length > 0) {
                this.config.media.mandatory.OfferToReceiveVideo = true;
            }
            if(stream.getAudioTracks().length > 0) {
                this.config.media.mandatory.OfferToReceiveAudio = true;
            }
            this.localStream = this.config.newMediaStream ? new Talk.MediaStream(stream) : stream;
            this.pc.addStream(this.localStream, this.config.media);
            log("Stream was added:", this.localStream);
            if(!negotiations) {
                this.negotiate();
            }
        }

        /**
         * When the peer adds its stream to us
         * @param {RTCMediaStreamEvent} event
         */

        private onAddStream(event: RTCMediaStreamEvent): void {
            if(event.stream) {
                log("Remote stream was added:", event.stream);
                this.remoteStream = event.stream;
                this.emit("streamAdded", this, this.remoteStream);
            }
            else {
                warn("Remote stream could not be added:", event);
            }
        }

        /**
         * When the added stream is removed
         * @param {RTCMediaStreamEvent} event
         */

        private onRemoveStream(event: RTCMediaStreamEvent): void {
            this.remoteStream = <MediaStream> {};
            this.emit("streamRemoved", this);
            log("Remote stream was removed from peer:", event);
        }

        /**
         * Send data to the peer, and chunk it if its needed
         * @param {string} label - Label of the data channel
         * @param {*} payload
         */

        public send(label: string, payload: any): void {
            payload = JSON.stringify(payload);
            var length = payload.length;
            var hash = sha256(payload);
            while(payload.length > 0) {
                var chunk = payload.slice(0, this.config.chunkSize);
                payload = payload.slice(this.config.chunkSize);
                var packet = <Packet> {
                    end: payload.length === 0,
                    payload: chunk,
                    length: length,
                    hash: hash
                };
                this.sendData(label, packet);
                this.emit("packetSent", this, packet);
            }
        }

        /**
         * Send data to the peer through the chosen data channel,
         * or SocketIO if it is not opened yet
         * @param {string} label - Label of the data channel
         * @param {*} payload
         */

        private sendData(label: string, payload: any) {
            var channel = this.getDataChannel(label);
            if(channel && <any> channel.readyState === "open") {
                log("Sending (%s):", label, payload);
                channel.send(JSON.stringify(payload));
            }
            else {
                warn("Data channel named `%s` does not exists or it is not opened", label);
                if(this.config.serverDataChannel) {
                    this.sendMessage("data", payload);
                }
            }
        }

        /**
         * Handle received data: if it is chunked, then wait for
         * each part and join them.
         * @param p {Talk.Packet}
         */

        private handleData(p: Packet): void {
            if(!this.chunks[p.hash]) {
                if(p.end) {
                    this.emit("data", this, JSON.parse(p.payload), p.hash, p.length);
                }
                else {
                    this.chunks[p.hash] = p.payload;
                }
            }
            else {
                this.chunks[p.hash] += p.payload;
                if(p.end) {
                    if(sha256(this.chunks[p.hash]) === p.hash) {
                        this.emit("data", this, JSON.parse(this.chunks[p.hash]), p.hash, p.length);
                    }
                    delete this.chunks[p.hash];
                }
            }
            this.emit("packetReceived", this, p);
        }

        /**
         * Get a data channel
         * @param {string} label
         * @returns {boolean||RTCDataChannel}
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
         * @param {RTCDataChannel} channel
         */

        private configDataChannel(channel: RTCDataChannel): void {
            channel.onclose = (event) => {
                log("Channel named `%s` was closed", channel.label);
                this.emit("channelClosed", this, event);
            };
            channel.onerror = (event) => {
                warn("Channel error:", event);
                this.emit("channelError", this, event);
            };
            channel.onopen = (event) => {
                log("Channel named `%s` was opened", channel.label);
                this.emit("channelOpened", this, event);
            };
            channel.onmessage = (event: any) => {
                if(event.data) {
                    var payload = JSON.parse(event.data);
                    log("Getting (%s):", channel.label, payload);
                    this.handleData(payload);
                }
            };
        }

        /**
         * Add a data channel
         * @param {string} label
         * @param {RTCDataChannelInit} [options]
         * @returns {RTCDataChannel}
         */

        public addDC(label: string, options?: RTCDataChannelInit): RTCDataChannel {
            var channel = this.pc.createDataChannel(label, options);
            this.configDataChannel(channel);
            this.channels.push(channel);
            log("Data channel was added:", channel);
            if(!negotiations) {
                this.negotiate();
            }
            return channel;
        }

        /**
         * When the peer has added a data channel between us
         * @param {RTCDataChannelEvent} event
         */

        private onDataChannel(event: RTCDataChannelEvent): void {
            if(event.channel) {
                this.configDataChannel(event.channel);
                this.channels.push(event.channel);
                log("Data channel was added:", event.channel)
            }
            else {
                warn("Data channel could not be added", event);
            }
        }

        /**
         * When the connection state has changed
         */

        private onConnectionChange(): void {
            log("Ice connection state was changed to `%s`", this.pc.iceConnectionState);
            switch(<any> this.pc.iceConnectionState) {
                case "disconnected":
                case "failed":
                    this.close();
                    break;
                case "completed":
                case "closed":
                    this.pc.onicecandidate = noop;
                    break;
                default:
                    this.pc.onicecandidate = this.onCandidate.bind(this);
                    break;
            }
            this.emit("connectionState", this, this.pc.iceConnectionState);
        }

        /**
         * When we found an ice candidate
         * @param {RTCIceCandidateEvent} event
         */

        private onCandidate(event: RTCIceCandidateEvent): void {
            if(event.candidate) {
                log("Candidate was found:", event.candidate);
                this.sendMessage("candidate", event.candidate);
            }
            else {
                log("End of candidates", event);
            }
        }

        /**
         * Handle a received ice candidate, through a message
         * @param {RTCIceCandidate} ice
         */

        private handleCandidate(ice: RTCIceCandidate): void {
            if(isStr(ice.candidate) && isStr(ice.sdpMid) && isNum(ice.sdpMLineIndex)) {
                log("Handling received candidate:", ice);
                this.pc.addIceCandidate(new IceCandidate(ice));
            }
            else {
                warn("Candidate could not be handled:", ice)
            }
        }

        /**
         * Negotiate with the peer
         */

        private negotiate(): void {
            log("Negotiation is needed");
            if(this.config.negotiate) {
                if(<any> this.pc.signalingState === "stable") {
                    this.offer();
                }
                else {
                    warn("Signaling state is not stable");
                }
            }
        }

        /**
         * Create an offer towards the peer
         */

        public offer(): void {
            log("Creating an offer");
            this.pc.createOffer(
                (offer: RTCSessionDescription) => {
                    this.pc.setLocalDescription(offer,
                        () => {
                            this.sendMessage("offer", offer);
                            log("Offer created:", offer);
                        },
                        (error: string) => {
                            warn(error);
                        }
                    );
                },
                (error: string) => {
                    warn(error);
                },
                this.config.media
            );
        }

        /**
         * Answer for a offer of the peer
         * @param {RTCSessionDescription} offer
         */

        private answer(offer: RTCSessionDescription): void {
            log("Answering for an offer:", offer);
            this.pc.setRemoteDescription(new SessionDescription(offer),
                () => {
                    this.pc.createAnswer(
                        (answer: RTCSessionDescription) => {
                            this.pc.setLocalDescription(answer,
                                () => {
                                    this.sendMessage("answer", answer);
                                },
                                (error: string) => {
                                    warn(error);
                                }
                            );
                        },
                        (error: string) => {
                            warn(error);
                        },
                        this.config.media
                    );
                },
                (error: string) => {
                    warn(error);
                }
            );
        }

        /**
         * Handle the answer of the peer
         * @param {RTCSessionDescription} answer
         */

        private handleAnswer(answer: RTCSessionDescription): void {
            log("Handling an answer:", answer);
            this.pc.setRemoteDescription(new SessionDescription(answer),
                () => {
                    log("Answer was handled successfully");
                },
                (error: string) => {
                    warn(error);
                }
            );
        }

        /**
         * Close the peer
         */

        public close() {
            this.pc.close();
            this.emit("closed", this);
            log("Peer closed:", this);
        }

        /**
         * Mute the peer audio stream
         */

        public mute(): void {
            this.remoteStream.getAudioTracks().forEach((track: MediaStreamTrack) => {
                track.enabled = false;
            });
            log("Peer audio was muted:", this)
        }

        /**
         * Unmute the peer audio stream
         */

        public unmute(): void {
            this.remoteStream.getAudioTracks().forEach((track: MediaStreamTrack) => {
                track.enabled = true;
            });
            log("Peer audio was unmuted:", this)
        }

        /**
         * Pause peer video stream
         */

        public pause(): void {
            this.remoteStream.getVideoTracks().forEach((track: MediaStreamTrack) => {
                track.enabled = false;
            });
            log("Peer video was paused:", this)
        }

        /**
         * Resume peer video stream
         */

        public resume(): void {
            this.remoteStream.getVideoTracks().forEach((track: MediaStreamTrack) => {
                track.enabled = true;
            });
            log("Peer video was resumed:", this)
        }

        /**
         * Mute the local audio stream for the peer
         */

        public muteLocal(): void {
            this.localStream.getAudioTracks().forEach((track: MediaStreamTrack) => {
                track.enabled = false;
            });
            log("Local audio for the peer was muted:", this)
        }

        /**
         * Unmute the local audio stream for the peer
         */

        public unmuteLocal(): void {
            this.localStream.getAudioTracks().forEach((track: MediaStreamTrack) => {
                track.enabled = true;
            });
            log("Local audio for the peer was unmuted:", this)
        }

        /**
         * Pause the local video stream for the peer
         */

        public pauseLocal(): void {
            this.localStream.getVideoTracks().forEach((track: MediaStreamTrack) => {
                track.enabled = false;
            });
            log("Local video for the peer was paused:", this)
        }

        /**
         * Resume the local video stream for the peer
         */

        public resumeLocal(): void {
            this.localStream.getVideoTracks().forEach((track: MediaStreamTrack) => {
                track.enabled = true;
            });
            log("Local video for the peer was resumed:", this)
        }
    }
}