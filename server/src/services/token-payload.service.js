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
    voterEncryptionPublicKey,
    issuedAt,
    used
}) {
    return {
        tokenId,
        token,
        voterSigningPublicKey,
        voterEncryptionPublicKey,
        issuedAt,
        used
    };
}