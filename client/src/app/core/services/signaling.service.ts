import { Injectable } from "@angular/core";
import { Subject } from "rxjs";
import { SignalingMessage } from "../../shared/models/p2p.models";

@Injectable({
    providedIn: "root"
})
export class SignalingService {
    private socket: WebSocket | null = null;

    messages$ = new Subject<SignalingMessage>();
    connected$ = new Subject<void>();
    disconnected$ = new Subject<void>();
    error$ = new Subject<string>();

    connect(wsUrl: string): void {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            return;
        }

        console.log(wsUrl);
        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
            this.connected$.next();
        };

        this.socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            this.messages$.next(message);
        };

        this.socket.onerror = () => {
            this.error$.next("Error en WebSocket de señalización");
        };

        this.socket.onclose = () => {
            this.disconnected$.next();
        };
    }

    joinWaitingRoom(sessionToken: string, voterId: string): void {
        this.send({
            type: "JOIN_WAITING_ROOM",
            payload: {
                sessionToken,
                voterId
            }
        })
    }

    send(message: SignalingMessage): void {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            this.error$.next("WebSocket de señalización no conectado");
            return;
        }

        this.socket.send(JSON.stringify(message));
    }

    close(): void {
        this.socket?.close();
        this.socket = null;
    }
}