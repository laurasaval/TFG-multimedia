export function createTokenRequestPayload({
    voterId,
    voteSigningPublicKey,
    voterSigningPublicKey,
    voterEncryptionPublicKey,
    requestedAt
}) {
    return {
        voterId,
        voteSigningPublicKey,
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