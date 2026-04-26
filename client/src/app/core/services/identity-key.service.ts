import { Injectable } from "@angular/core";
import { WebCryptoEd25519Service } from "./web-crypto-ed25519.service";

@Injectable({
    providedIn: "root"
})
export class IdentityKeyService {
    private identityPrivateKeyPem: string | null = null;
    private identityPrivateKey: CryptoKey | null = null;

    constructor(private cryptoService: WebCryptoEd25519Service) { }

    async setPrivateKeyPem(privateKeyPem: string): Promise<void> {
        this.identityPrivateKeyPem = privateKeyPem;
        this.identityPrivateKey = await this.cryptoService.importPrivateKeyFromPem(privateKeyPem);
    }

    getIdentityPrivateKeyPem(): string | null {
        return this.identityPrivateKeyPem;
    }

    getIdentityPrivateKey(): CryptoKey | null {
        return this.identityPrivateKey;
    }

    clearIdentityPrivateKey(): void {
        this.identityPrivateKey = null;
        this.identityPrivateKeyPem = null;
    }
}