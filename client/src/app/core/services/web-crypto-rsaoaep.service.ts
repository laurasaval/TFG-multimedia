import { Injectable } from "@angular/core";
import { arrayBufferToBase64, base64ToArrayBuffer } from "../utils/base64.util";
import { pemToArrayBuffer, exportPrivateKeyToPem, exportPublicKeyToPem } from "../utils/pem.util";

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

    async importPublicKeyFromPem(publicKeyPem: string): Promise<CryptoKey> {
        return crypto.subtle.importKey(
            "spki",
            pemToArrayBuffer(publicKeyPem),
            {
                name: "RSA-OAEP",
                hash: "SHA-256"
            },
            false,
            ["encrypt"]
        );
    }

    async importPrivateKeyFromPem(privateKeyPem: string): Promise<CryptoKey> {
        return crypto.subtle.importKey(
            "pkcs8",
            pemToArrayBuffer(privateKeyPem),
            {
                name: "RSA-OAEP",
                hash: "SHA-256"
            },
            false,
            ["decrypt"]
        );
    }

    async exportPublicKeyToPem(publicKey: CryptoKey): Promise<string> {
        return exportPublicKeyToPem(publicKey);
    }

    async exportPrivateKeyToPem(privateKey: CryptoKey): Promise<string> {
        return exportPrivateKeyToPem(privateKey);
    }

    async encryptKey(publicKey: CryptoKey, keyToBeEncypted: ArrayBuffer): Promise<string> {
        const encryptedKey = await crypto.subtle.encrypt(
            {
                name: "RSA-OAEP"
            },
            publicKey,
            keyToBeEncypted
        );

        return arrayBufferToBase64(encryptedKey);
    }

    async decryptKey(privateKey: CryptoKey, encryptedKeyBase64: string): Promise<ArrayBuffer> {
        return crypto.subtle.decrypt(
            {
                name: "RSA-OAEP"
            },
            privateKey,
            base64ToArrayBuffer(encryptedKeyBase64)
        );
    }
}