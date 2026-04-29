export function createTokenRequestPayload({
    voterId,
    voterSigningPublicKey,
    voterEncryptionPublicKey,
    requestedAt
}) {
    return {
        voterId,
        voterSigningPublicKey,
        voterEncryptionPublicKey,
        requestedAt
    };
}

export function createIssuedTokenPayload({
    tokenId,
    token,
    voterSigningPublicKey,
    issuedAt,
    used
}) {
    return {
        tokenId,
        token,
        voterSigningPublicKey,
        issuedAt,
        used
    };
}