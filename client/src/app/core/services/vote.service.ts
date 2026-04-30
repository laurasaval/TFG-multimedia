import { Injectable } from "@angular/core";
import { VotePlain, VoteEncrypted } from "../../shared/models/vote.model";
import { WebCryptoAESGCMService } from "./web-crypto-aesgcm256.service";

@Injectable({
    providedIn: "root"
})
export class VoteService {

    constructor(
        private webCryptoAESGCMService: WebCryptoAESGCMService
    ) { }

    prepareVotePlain(approved_countries: string[]): VotePlain {
        if (!approved_countries || approved_countries.length === 0) {
            throw new Error("Debe seleccionar al menos un país");
        }

        return {
            approved_countries: [...approved_countries].sort(),
            vote_timestamp: new Date().toISOString(),
            vote_nonce: this.generateNonce()
        };
    }

    async encryptVote(votePlain: VotePlain): Promise<[VoteEncrypted, string]> {
        const symmetricKey = await this.webCryptoAESGCMService.generateKey();

        const encryptedVote = await this.webCryptoAESGCMService.encrypt(symmetricKey, votePlain);
        const symmetricKeyBase64 = await this.webCryptoAESGCMService.exportKeyToBase64(symmetricKey);

        return [encryptedVote, symmetricKeyBase64];
    }

    private generateNonce(): string {
        const bytes = new Uint8Array(32);
        crypto.getRandomValues(bytes);

        return Array.from(bytes)
            .map((byte) => byte.toString(16).padStart(2, "0"))
            .join("");
    }
}