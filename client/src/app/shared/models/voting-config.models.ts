export interface Candidate {
    countryCode: string;
    countryName: string;
}

export interface VotingConfig {
    editionCode: string;
    title: string;
    votingStart: string;
    votingEnd: string;
    candidates: Candidate[];
}

export interface VotingConfigResponse {
    ok: boolean;
    message?: string;
    voting?: VotingConfig;
}