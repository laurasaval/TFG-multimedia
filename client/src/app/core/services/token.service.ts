import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";

import { API_CONFIG } from "../config/api.config";

import { VoterKeyService } from "./voter-key.service";
import { IdentityKeyService } from "./identity-key.service";
import { WebCryptoEd25519Service } from "./web-crypto-ed25519.service";
import { HybridCryptoService } from "./hybrid-crypto.service";
import { CountryKeyService } from "./country-key.service";

import { canonicalJson } from "../../../../../shared/utils/canonical-json.util";
import { VoteToken, VoteTokenRequestBody, VoteTokenRequestPayload, VoteTokenResponse } from "../../shared/models/token.models";
import { Voter } from "../../shared/models/auth.models";

@Injectable({
    providedIn: 'root'
})
export class TokenService {
    private readonly storageKey: string = "tfg_vote_token";
    private readonly apiUrl: string = `${API_CONFIG.BASE_URL}/token`;

    constructor(
        private http: HttpClient,
        private voterKeyService: VoterKeyService,
        private identityKeyService: IdentityKeyService,
        private cryptoService: WebCryptoEd25519Service,
        private hybridCryptoService: HybridCryptoService,
        private countryKeyService: CountryKeyService
    ) { }

    getStoredToken(): VoteToken | null {
        const token = localStorage.getItem(this.storageKey);
        return token ? JSON.parse(token) : null;
    }

    saveToken(token: VoteToken): void {
        localStorage.setItem(this.storageKey, JSON.stringify(token));
    }

    clearToken(): void {
        localStorage.removeItem(this.storageKey);
    }

    async requestVoteToken(voter: Voter): Promise<VoteToken> {
        if (voter.token && voter.token.length > 0) {
            this.saveToken(voter.token[0]);
            return voter.token[0];
        }

        const voteSigningVoteKeyPair = await this.voterKeyService.ensureSigningVoteKeyPair();
        const voterSigningVoteKeyPair = await this.voterKeyService.ensureVoterSigningVoteKeyPair();
        const encryptionVoteKeyPair = await this.voterKeyService.ensureEncryptionVoteKeyPair();
        const identityPrivateKey = this.identityKeyService.getIdentityPrivateKey();

        if (!identityPrivateKey || !voteSigningVoteKeyPair || !voterSigningVoteKeyPair || !identityPrivateKey) {
            throw new Error('No se han encontrado las claves necesarias');
        }

        const payload: VoteTokenRequestPayload = {
            voterId: voter.voterId,
            voteSigningPublicKey: voteSigningVoteKeyPair.publicKey,
            voterSigningPublicKey: voterSigningVoteKeyPair.publicKey,
            voterEncryptionPublicKey: encryptionVoteKeyPair.publicKey,
            requestedAt: new Date().toISOString()
        };
        const canonicalJsonPayload = canonicalJson(payload);

        const identitySignature = await this.cryptoService.signToBase64(
            identityPrivateKey,
            canonicalJsonPayload
        );

        const tokenRequestEnvelope: VoteTokenRequestBody = {
            ...payload,
            identitySignature
        };

        const countryEncryptionPublicKey = this.countryKeyService.getCountryEncryptionPublicKey(
            voter.voterId.split('-')[0]
        );

        const encryptedRequest = await this.hybridCryptoService.encryptJsonForPublicKey(
            tokenRequestEnvelope,
            countryEncryptionPublicKey
        )

        const response = await firstValueFrom(
            this.http.post<VoteTokenResponse>(
                this.apiUrl,
                encryptedRequest
            )
        );

        console.log(response);

        if (!response.ok || !response.encryptedToken) {
            throw new Error(response.message ?? 'No se ha recibido un token de voto');
        }

        const token = await this.hybridCryptoService.decryptJsonWithPrivateKey<VoteToken>(
            response.encryptedToken,
            encryptionVoteKeyPair.privateKey
        )

        await this.verifyCountrySignature(voter.voterId.split('-')[0], token);

        this.saveToken(token);
        return token;
    }

    private async verifyCountrySignature(
        countryCode: string,
        token: VoteToken
    ): Promise<void> {
        const countrySigningPublicKey = this.countryKeyService.getCountrySigningPublicKey(countryCode);
        const publicKey = await this.cryptoService.importPublicKeyFromPem(countrySigningPublicKey);

        const signedPayload = {
            tokenId: token.tokenId,
            token: token.token,
            voterSigningPublicKey: token.voterSigningPublicKey,
            issuedAt: token.issuedAt,
            used: token.used
        };

        const isValid = await this.cryptoService.verifySignature(
            publicKey,
            canonicalJson(signedPayload),
            token.anccSignature
        );

        if (!isValid) {
            throw new Error("La firma del token no es válida");
        }
    }
}