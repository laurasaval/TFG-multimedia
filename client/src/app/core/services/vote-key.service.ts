import { Injectable } from "@angular/core";
import { WebCryptoEd25519Service } from "./web-crypto-ed25519.service";
import { VoteKeyPair } from "../../shared/models/token.models";

@Injectable({
    providedIn: 'root'
})
export class VoteKeyService {
    private readonly storageKey = 'tfg_vote_keypair';

    constructor(private webCryptoEd25519Service: WebCryptoEd25519Service) { }

    saveVoteKeyPair(keyPair: VoteKeyPair): void {
        localStorage.setItem(this.storageKey, JSON.stringify(keyPair));
    }

    getVoteKeyPair(): VoteKeyPair | null {
        const keyPair = localStorage.getItem(this.storageKey);
        return keyPair ? JSON.parse(keyPair) : null;
    }

    clearVoteKeyPair(): void {
        localStorage.removeItem(this.storageKey);
    }

    async ensureVoteKeyPair(): Promise<VoteKeyPair> {
        const existingKeyPair = this.getVoteKeyPair();

        if (existingKeyPair) {
            return existingKeyPair;
        }

        const keyPair = await this.webCryptoEd25519Service.generateVoteKeyPair();
        const publicKey = await this.webCryptoEd25519Service.exportPublicKeyToPem(keyPair.publicKey);
        const privateKey = await this.webCryptoEd25519Service.exportPrivateKeyToPem(keyPair.privateKey);

        this.saveVoteKeyPair({ publicKey, privateKey });

        return { publicKey, privateKey };
    }

}