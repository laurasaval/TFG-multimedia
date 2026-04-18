import { Injectable } from "@angular/core";

@Injectable({
    providedIn: "root"
})
export class IdentityKeyService {
    private identityPrivateKey: string | null = null;

    setIdentityPrivateKey(privateKeyPem: string): void {
        this.identityPrivateKey = privateKeyPem;
    }

    getIdentityPrivateKey(): string | null {
        return this.identityPrivateKey;
    }

    clearIdentityPrivateKey(): void {
        this.identityPrivateKey = null;
    }
}
