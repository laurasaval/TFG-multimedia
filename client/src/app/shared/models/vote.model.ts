export interface VotePlain {
    approved_countries: string[];
    vote_timestamp: string;
    vote_nonce: string;
}

export interface VoteEncrypted {
    ciphertextBase64: string;
    ivBase64: string;
}