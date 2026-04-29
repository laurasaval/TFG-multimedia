import { Injectable } from "@angular/core";
import { WebCryptoEd25519Service } from "./web-crypto-ed25519.service";
import { WebCryptoRSAOAEPService } from "./web-crypto-rsaoaep.service";
import { VoteKeyPair } from "../../shared/models/token.models";
import { exportPublicKeyToPem, exportPrivateKeyToPem } from "../utils/pem.util";

@Injectable({
    providedIn: 'root'
})
export class VoterKeyService {
    private readonly signStorageKey = 'tfg_vote_sign_keypair';
    private readonly encryptStorageKey = 'tfg_vote_encrypt_keypair';

    constructor(
        private webCryptoEd25519Service: WebCryptoEd25519Service,
        private webCryptoRSAOAEPService: WebCryptoRSAOAEPService
    ) { }

    saveVoterKeyPair(storageKey: string, keyPair: VoteKeyPair): void {
        localStorage.setItem(storageKey, JSON.stringify(keyPair));
    }

    getVoterKeyPair(storageKey: string): VoteKeyPair | null {
        const keyPair = localStorage.getItem(storageKey);
        return keyPair ? JSON.parse(keyPair) : null;
    }

    clearVoterKeyPair(storageKey: string): void {
        localStorage.removeItem(storageKey);
    }

    async ensureSigningVoteKeyPair(): Promise<VoteKeyPair> {
        const existingKeyPair = this.getVoterKeyPair(this.signStorageKey);

        if (existingKeyPair) {
            return existingKeyPair;
        }

        const keyPair = await this.webCryptoEd25519Service.generateKeyPair();
        const publicKey = await exportPublicKeyToPem(keyPair.publicKey);
        const privateKey = await exportPrivateKeyToPem(keyPair.privateKey);

        this.saveVoterKeyPair(this.signStorageKey, { publicKey, privateKey });

        return { publicKey, privateKey };
    }

    async ensureEncryptionVoteKeyPair(): Promise<VoteKeyPair> {
        const existingKeyPair = this.getVoterKeyPair(this.encryptStorageKey);

        if (existingKeyPair) {
            return existingKeyPair;
        }

        const keyPair = await this.webCryptoRSAOAEPService.generateKeyPair();
        const publicKey = await exportPublicKeyToPem(keyPair.publicKey);
        const privateKey = await exportPrivateKeyToPem(keyPair.privateKey);

        this.saveVoterKeyPair(this.encryptStorageKey, { publicKey, privateKey });

        return { publicKey, privateKey };
    }
}