import { SafeResourceUrl } from "@angular/platform-browser";

export type VotingState = 'not-started' | 'open' | 'closed';
export type VoteStep = 'selection' | 'review' | 'p2p';

export interface SelectedPerformanceVideo {
    countryCode: string;
    countryName: string;
    safeUrl: SafeResourceUrl;
}