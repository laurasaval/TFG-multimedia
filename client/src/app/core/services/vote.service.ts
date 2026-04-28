import { Injectable } from "@angular/core";
import { VotePlain } from "../../shared/models/vote.model";

@Injectable({
    providedIn: "root"
})
export class VoteService {
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

    private generateNonce(): string {
        const bytes = new Uint8Array(32);
        crypto.getRandomValues(bytes);

        return Array.from(bytes)
            .map((byte) => byte.toString(16).padStart(2, "0"))
            .join("");
    }
}