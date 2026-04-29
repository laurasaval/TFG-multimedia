import { Injectable } from "@angular/core";
import { arrayBufferToBase64, base64ToArrayBuffer } from "../utils/base64.util";
import { strimPemHeaders } from "../utils/pem.util";

@Injectable({
    providedIn: 'root'
})
export class WebCryptoEd25519Service {
    async generateKeyPair(): Promise<CryptoKeyPair> {
        return await crypto.subtle.generateKey(
            { name: 'Ed25519' },
            true,
            ['sign', 'verify']
        );
    }

    async signToBase64(privateKey: CryptoKey, data: string): Promise<string> {
        const signature = await crypto.subtle.sign(
            { name: 'Ed25519' },
            privateKey,
            new TextEncoder().encode(data)
        );

        return arrayBufferToBase64(signature);
    }

    async verifySignature(publicKey: CryptoKey, data: string, signature: string): Promise<boolean> {
        const signatureBuffer = base64ToArrayBuffer(signature);
        const dataBuffer = new TextEncoder().encode(data);

        return await crypto.subtle.verify(
            { name: 'Ed25519' },
            publicKey,
            signatureBuffer,
            dataBuffer
        );
    }

    async importPublicKeyFromPem(pem: string): Promise<CryptoKey> {
        const cleanPem = strimPemHeaders(pem);
        const binary = base64ToArrayBuffer(cleanPem);

        return await crypto.subtle.importKey(
            'spki',
            binary,
            { name: 'Ed25519' },
            false,
            ['verify']
        );
    }

    async importPrivateKeyFromPem(pem: string): Promise<CryptoKey> {
        const cleanPem = strimPemHeaders(pem);
        const binary = base64ToArrayBuffer(cleanPem);

        return await crypto.subtle.importKey(
            'pkcs8',
            binary,
            { name: 'Ed25519' },
            false,
            ['sign']
        );
    }
}
