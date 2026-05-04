import { Injectable } from "@angular/core";
import { arrayBufferToBase64, base64ToArrayBuffer } from "../utils/base64.util";
import { EncryptedResult } from "../../shared/models/encrypted.model";

@Injectable({
    providedIn: 'root'
})
export class WebCryptoAESGCMService {
    async generateKey(): Promise<CryptoKey> {
        return crypto.subtle.generateKey(
            {
                name: 'AES-GCM',
                length: 256
            },
            true,
            ['encrypt', 'decrypt']
        ) as Promise<CryptoKey>;
    }

    async exportRawKey(key: CryptoKey): Promise<ArrayBuffer> {
        return await crypto.subtle.exportKey('raw', key);
    }

    async exportKeyToBase64(key: CryptoKey): Promise<string> {
        const raw = await crypto.subtle.exportKey('raw', key);
        return arrayBufferToBase64(raw);
    }

    async importRawKey(rawKey: ArrayBuffer): Promise<CryptoKey> {
        return crypto.subtle.importKey(
            'raw',
            rawKey,
            {
                name: 'AES-GCM',
                length: 256
            },
            true,
            ['encrypt', 'decrypt']
        ) as Promise<CryptoKey>;
    }

    async encrypt(key: CryptoKey, data: unknown): Promise<EncryptedResult> {
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encoded = new TextEncoder().encode(JSON.stringify(data));

        const ciphertext = await crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv
            },
            key,
            encoded
        );

        return {
            ivBase64: arrayBufferToBase64(iv.buffer),
            ciphertextBase64: arrayBufferToBase64(ciphertext)
        };
    }

    async decrypt<T>(key: CryptoKey, data: EncryptedResult): Promise<T> {
        const iv = base64ToArrayBuffer(data.ivBase64);
        const ciphertext = base64ToArrayBuffer(data.ciphertextBase64);

        const plaintextBuffer = await crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv
            },
            key,
            ciphertext
        );

        return JSON.parse(new TextDecoder().decode(plaintextBuffer));
    }
}