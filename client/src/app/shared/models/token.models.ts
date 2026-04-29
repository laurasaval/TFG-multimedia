export interface VoteTokenRequestPayload {
    voterId: string;
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
    voterEncryptionPublicKey: string;
    issuedAt: string;
    used: boolean;
    countrySignature: string;
}

export interface VoteTokenResponse {
    ok: boolean;
    message: string;
    token: VoteToken;
}

export interface VoteKeyPair {
    publicKey: string;
    privateKey: string;
}
