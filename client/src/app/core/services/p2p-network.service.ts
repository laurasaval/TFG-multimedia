import { Injectable } from "@angular/core";
import { BehaviorSubject, take } from "rxjs";
import { SignalingService } from "./signaling.service";
import { WebRTCService } from "./webrtc.service";
import { LocalRoundState, RoundCreatedPayload } from "../../shared/models/p2p.models";
import { RoleSelectionService } from "./role-selection.service";

@Injectable({
    providedIn: "root"
})
export class P2PNetworkService {
    waitingState$ = new BehaviorSubject<any | null>(null);
    roundState$ = new BehaviorSubject<LocalRoundState | null>(null);
    connectionEvents$ = new BehaviorSubject<any[]>([]);
    p2pMessages$ = new BehaviorSubject<any[]>([]);
    error$ = new BehaviorSubject<string | null>(null);

    constructor(
        private signalingService: SignalingService,
        private webRTCService: WebRTCService,
        private roleSelectionService: RoleSelectionService
    ) {
        this.signalingService.messages$.subscribe(async (message) => {
            switch (message.type) {
                case "WAITING_ROOM_UPDATE":
                    this.waitingState$.next(message.payload);
                    break;

                case "ROUND_CREATED":
                    await this.handleRoundCreated(message.payload);
                    break;

                case "ERROR":
                    this.error$.next(message.payload?.message ?? "Error P2P");
                    break;
            }
        });

        this.webRTCService.connectionState$.subscribe((event) => {
            this.connectionEvents$.next([
                ...this.connectionEvents$.value,
                event
            ]);
        });

        this.webRTCService.p2pMessage$.subscribe((event) => {
            this.p2pMessages$.next([
                ...this.p2pMessages$.value,
                event
            ]);
        });
    }

    connectAndJoin(params: { wsUrl: string; sessionToken: string; voterId: string; }): void {
        this.error$.next(null);

        this.signalingService.connect(params.wsUrl);

        this.signalingService.connected$
            .pipe(take(1))
            .subscribe(() => {
                this.signalingService.joinWaitingRoom(
                    params.sessionToken,
                    params.voterId
                );
            });
    }

    broadcastTestMessage(): void {
        this.webRTCService.broadcast({
            type: "P2P_TEST",
            payload: {
                text: "Hola desde WebRTC!",
                sentAt: new Date().toISOString()
            }
        });
    }

    private async handleRoundCreated(
        round: RoundCreatedPayload
    ): Promise<void> {
        try {
            const { lastBlockHash, roles } =
                await this.roleSelectionService.selectRolesFromBlockchain(
                    round.peers,
                    round.blockchain
                );

            const localRound: LocalRoundState = {
                ...round,
                lastBlockHash,
                roles
            };

            this.roundState$.next(localRound);

            await this.webRTCService.initializeRound(localRound);
        } catch (error: any) {
            this.error$.next(
                error?.message ?? "No se pudo procesar la ronda P2P"
            );
        }
    }
}