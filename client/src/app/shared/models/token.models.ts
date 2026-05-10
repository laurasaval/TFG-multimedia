import { EncryptedEnvelope } from "./encrypted.model";

export interface VoteTokenRequestPayload {
    voterId: string;
    voterSigningPublicKey: string;
    tokenSigningPublicKey: string;
    voterEncryptionPublicKey: string;
    requestedAt: string;
}

export interface VoteTokenRequestBody extends VoteTokenRequestPayload {
    identitySignature: string;
}

export interface VoteToken {
    tokenId: string;
    token: string;
    tokenSigningPublicKey: string;
    issuedAt: string;
    used: boolean;
    anccSignature: string;
}

export interface VoteTokenResponse {
    ok: boolean;
    message: string;
    encryptedToken: EncryptedEnvelope;
}

export interface VoteKeyPair {
    publicKey: string;
    privateKey: string;
}
