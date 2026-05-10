export function createTokenRequestPayload({
    voterId,
    voterSigningPublicKey,
    tokenSigningPublicKey,
    voterEncryptionPublicKey,
    requestedAt
}) {
    return {
        voterId,
        voterSigningPublicKey,
        tokenSigningPublicKey,
        voterEncryptionPublicKey,
        requestedAt
    };
}

export function createIssuedTokenPayload({
    tokenId,
    token,
    tokenSigningPublicKey,
    issuedAt,
    used
}) {
    return {
        tokenId,
        token,
        tokenSigningPublicKey,
        issuedAt,
        used
    };
}