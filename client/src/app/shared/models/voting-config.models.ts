export interface Candidate {
    countryCode: string;
    countryName: string;
    performanceUrl?: string;
    performanceOrder: number;
    songTitle: string;
    songTitleLang: string;
    singer: string;
    singerLang: string;
    thumbnailUrl: string;
    thumbnailAlt: string;
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