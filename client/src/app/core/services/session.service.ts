import { Injectable } from "@angular/core";
import { Session } from "../../shared/models/auth.models";

@Injectable({
    providedIn: "root"
})
export class SessionService {
    private readonly storageKey: string = "tfg_session";

    setSession(session: Session): void {
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