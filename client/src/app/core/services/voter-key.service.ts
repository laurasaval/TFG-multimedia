import { Injectable } from "@angular/core";
import { WebCryptoEd25519Service } from "./web-crypto-ed25519.service";
import { WebCryptoRSAOAEPService } from "./web-crypto-rsaoaep.service";
import { VoteKeyPair } from "../../shared/models/token.models";
import { exportPublicKeyToPem, exportPrivateKeyToPem } from "../utils/pem.util";

@Injectable({
    providedIn: 'root'
})
export class VoterKeyService {
    private readonly voterSignStorageKey = 'tfg_votef_sign_keypair';
    private readonly encryptStorageKey = 'tfg_voter_encrypt_keypair';
    private readonly tokenSignStorageKey = 'tfg_token_sign_keypair';

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

    async ensureVoterSigningKeyPair(): Promise<VoteKeyPair> {
        const existingKeyPair = this.getVoterKeyPair(this.voterSignStorageKey);

        if (existingKeyPair) {
            return existingKeyPair;
        }

        const keyPair = await this.webCryptoEd25519Service.generateKeyPair();
        const publicKey = await exportPublicKeyToPem(keyPair.publicKey);
        const privateKey = await exportPrivateKeyToPem(keyPair.privateKey);

        this.saveVoterKeyPair(this.voterSignStorageKey, { publicKey, privateKey });

        return { publicKey, privateKey };
    }


    async ensureTokenSigningVoteKeyPair(): Promise<VoteKeyPair> {
        const existingKeyPair = this.getVoterKeyPair(this.tokenSignStorageKey);

        if (existingKeyPair) {
            return existingKeyPair;
        }

        const keyPair = await this.webCryptoEd25519Service.generateKeyPair();
        const publicKey = await exportPublicKeyToPem(keyPair.publicKey);
        const privateKey = await exportPrivateKeyToPem(keyPair.privateKey);

        this.saveVoterKeyPair(this.tokenSignStorageKey, { publicKey, privateKey });

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