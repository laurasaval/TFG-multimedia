export interface LoginRequest {
    voterId: string;
    secretCode: string;
}

export interface LoginResponse {
    ok: boolean;
    message: string;
    voter: {
        voterId: string;
        identityPublicKey: string;
        token: string[];
    };
    session: {
        sessionToken: string;
        createdAt: string;
        expiresAt: string;
    };
}