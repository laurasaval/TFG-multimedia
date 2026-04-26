import { VoteToken } from "./token.models";

export interface Voter {
    voterId: string;
    identityPublicKey: string;
    token: VoteToken[];
}

export interface Session {
    sessionToken: string;
    createdAt: string;
    expiresAt: string;
}

export interface LoginRequest {
    voterId: string;
    secretCode: string;
}

export interface LoginResponse {
    ok: boolean;
    message: string;
    voter: Voter;
    session: Session;
}