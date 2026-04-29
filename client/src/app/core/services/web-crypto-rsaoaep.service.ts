import { Injectable } from "@angular/core";

@Injectable({ providedIn: "root" })
export class WebCryptoRSAOAEPService {
    async generateKeyPair(): Promise<CryptoKeyPair> {
        return crypto.subtle.generateKey(
            {
                name: "RSA-OAEP",
                modulusLength: 2048,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: "SHA-256"
            },
            true,
            ["encrypt", "decrypt"]
        ) as Promise<CryptoKeyPair>;
    }
}