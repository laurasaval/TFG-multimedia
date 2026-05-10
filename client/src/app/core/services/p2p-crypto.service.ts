import { Injectable } from "@angular/core";
import { sha256Hex } from "../utils/sha256Hex.util";
import { canonicalJson } from "../utils/canonical-json.util";
import { WebCryptoEd25519Service } from "./web-crypto-ed25519.service";
import { VoterKeyService } from "./voter-key.service";
import { SignedP2PPayload } from "../../shared/models/p2p-message.models";

@Injectable({
    providedIn: "root"
})
export class P2PCryptoService {
    constructor(
        private webCryptoEd25519Service: WebCryptoEd25519Service,
        private voterKeyService: VoterKeyService
    ) { }

    async signWithVoterSigningKey<TPayload>(
        signerPeerId: string,
        payload: TPayload
    ): Promise<SignedP2PPayload<TPayload>> {
        const keyPair = await this.voterKeyService.ensureVoterSigningKeyPair();

        const privateKey = await this.webCryptoEd25519Service.importPrivateKeyFromPem(
            keyPair.privateKey
        );

        const signatureBase64 = await this.webCryptoEd25519Service.signToBase64(
            privateKey,
            canonicalJson(payload)
        );

        return {
            signerPeerId,
            payload,
            signatureBase64
        };
    }

    async signWithTokenSigningKey<TPayload>(
        payload: TPayload
    ): Promise<{
        payload: TPayload;
        signatureBase64: string;
    }> {
        const keyPair = await this.voterKeyService.ensureTokenSigningVoteKeyPair();

        const privateKey = await this.webCryptoEd25519Service.importPrivateKeyFromPem(
            keyPair.privateKey
        );

        const signatureBase64 = await this.webCryptoEd25519Service.signToBase64(
            privateKey,
            canonicalJson(payload)
        );

        return {
            payload,
            signatureBase64
        };
    }

    async verifyWithPublicKey<TPayload>(
        payload: TPayload,
        signatureBase64: string,
        publicKeyPem: string
    ): Promise<boolean> {
        const publicKey = await this.webCryptoEd25519Service.importPublicKeyFromPem(
            publicKeyPem
        );

        return this.webCryptoEd25519Service.verifySignature(
            publicKey,
            canonicalJson(payload),
            signatureBase64
        );
    }

    async verifySignedP2PPayload<TPayload>(
        signedPayload: SignedP2PPayload<TPayload>,
        publicKeyPem: string
    ): Promise<boolean> {
        const publicKey = await this.webCryptoEd25519Service.importPublicKeyFromPem(
            publicKeyPem
        );

        return this.webCryptoEd25519Service.verifySignature(
            publicKey,
            canonicalJson(signedPayload.payload),
            signedPayload.signatureBase64
        );
    }

    async hashCanonical(value: unknown): Promise<string> {
        return sha256Hex(canonicalJson(value));
    }
}