import { Injectable } from "@angular/core";

@Injectable({
    providedIn: "root"
})
export class SessionService {
    private readonly storageKey: string = "tfg_session";

    setSession(session: unknown): void {
        localStorage.setItem(this.storageKey, JSON.stringify(session));
    }

    getSession(): { sessionToken?: string } | null {
        const session = localStorage.getItem(this.storageKey);
        return session ? JSON.parse(session) : null;
    }

    getSessionToken(): string | null {
        return this.getSession()?.sessionToken ?? null;
    }

    clearSession(): void {
        localStorage.removeItem(this.storageKey);
    }
}