import { Injectable } from "@angular/core";
import { Subject } from "rxjs";
import { SignalingService } from "./signaling.service";
import { LocalRoundState, P2PPeer, SignalingMessage } from "../../shared/models/p2p.models";

@Injectable({
    providedIn: "root"
})
export class WebRTCService {
    private ownPeerId = "";
    private peers: P2PPeer[] = [];

    private connections = new Map<string, RTCPeerConnection>();
    private dataChannels = new Map<string, RTCDataChannel>();

    p2pMessage$ = new Subject<{ fromPeerId: string; data: any }>();
    connectionState$ = new Subject<any>();

    constructor(private signalingService: SignalingService) {
        this.signalingService.messages$.subscribe((message) => {
            this.handleSignalingMessage(message);
        });
    }

    async initializeRound(round: LocalRoundState): Promise<void> {
        this.ownPeerId = round.ownPeerId;
        this.peers = round.peers;

        const otherPeers = this.peers.filter(
            (peer) => peer.peerId !== this.ownPeerId
        );

        for (const peer of otherPeers) {
            await this.ensureConnection(peer.peerId);
        }

        for (const peer of otherPeers) {
            if (this.ownPeerId < peer.peerId) {
                await this.createOffer(peer.peerId);
            }
        }
    }

    sendToPeer(peerId: string, data: any): void {
        const channel = this.dataChannels.get(peerId);

        if (!channel || channel.readyState !== "open") {
            console.warn("DataChannel no abierto para", peerId);
            return;
        }

        channel.send(JSON.stringify(data));
    }

    broadcast(data: any): void {
        for (const peerId of this.dataChannels.keys()) {
            this.sendToPeer(peerId, data);
        }
    }

    private async ensureConnection(peerId: string): Promise<RTCPeerConnection> {
        const existing = this.connections.get(peerId);

        if (existing) {
            return existing;
        }

        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" }
            ]
        });

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                this.signalingService.send({
                    type: "WEBRTC_ICE_CANDIDATE",
                    payload: {
                        fromPeerId: this.ownPeerId,
                        toPeerId: peerId,
                        candidate: event.candidate
                    }
                });
            }
        };

        pc.onconnectionstatechange = () => {
            this.connectionState$.next({
                peerId,
                state: pc.connectionState
            });
        };

        pc.ondatachannel = (event) => {
            this.setupDataChannel(peerId, event.channel);
        };

        const channel = pc.createDataChannel(`data-${this.ownPeerId}-to-${peerId}`);
        this.setupDataChannel(peerId, channel);

        this.connections.set(peerId, pc);

        return pc;
    }

    private setupDataChannel(peerId: string, channel: RTCDataChannel): void {
        this.dataChannels.set(peerId, channel);

        channel.onopen = () => {
            this.connectionState$.next({
                peerId,
                state: "datachannel-open"
            });
        };

        channel.onclose = () => {
            this.connectionState$.next({
                peerId,
                state: "datachannel-closed"
            });
        };

        channel.onmessage = (event) => {
            try {
                this.p2pMessage$.next({
                    fromPeerId: peerId,
                    data: JSON.parse(event.data)
                });
            } catch {
                this.p2pMessage$.next({
                    fromPeerId: peerId,
                    data: event.data
                });
            }
        };
    }

    private async createOffer(peerId: string): Promise<void> {
        const pc = await this.ensureConnection(peerId);

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        this.signalingService.send({
            type: "WEBRTC_OFFER",
            payload: {
                fromPeerId: this.ownPeerId,
                toPeerId: peerId,
                description: pc.localDescription
            }
        });
    }

    private async handleOffer(payload: any): Promise<void> {
        const { fromPeerId, description } = payload;

        const pc = await this.ensureConnection(fromPeerId);

        await pc.setRemoteDescription(description);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        this.signalingService.send({
            type: "WEBRTC_ANSWER",
            payload: {
                fromPeerId: this.ownPeerId,
                toPeerId: fromPeerId,
                description: pc.localDescription
            }
        });
    }

    private async handleAnswer(payload: any): Promise<void> {
        const { fromPeerId, description } = payload;

        const pc = this.connections.get(fromPeerId);

        if (!pc) {
            return;
        }

        await pc.setRemoteDescription(description);
    }

    private async handleIceCandidate(payload: any): Promise<void> {
        const { fromPeerId, candidate } = payload;

        const pc = this.connections.get(fromPeerId);

        if (!pc) {
            return;
        }

        await pc.addIceCandidate(candidate);
    }

    private handleSignalingMessage(message: SignalingMessage): void {
        switch (message.type) {
            case "WEBRTC_OFFER":
                this.handleOffer(message.payload);
                break;

            case "WEBRTC_ANSWER":
                this.handleAnswer(message.payload);
                break;

            case "WEBRTC_ICE_CANDIDATE":
                this.handleIceCandidate(message.payload);
                break;
        }
    }
}