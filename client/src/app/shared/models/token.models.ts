import { EncryptedEnvelope } from "./encrypted.model";

export interface VoteTokenRequestPayload {
    voterId: string;
    voteSigningPublicKey: string;
    voterSigningPublicKey: string;
    voterEncryptionPublicKey: string;
    requestedAt: string;
}

export interface VoteTokenRequestBody extends VoteTokenRequestPayload {
    identitySignature: string;
}

export interface VoteToken {
    tokenId: string;
    token: string;
    voterSigningPublicKey: string;
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
