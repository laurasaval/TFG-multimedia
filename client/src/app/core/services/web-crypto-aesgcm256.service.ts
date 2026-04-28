import { Injectable } from "@angular/core";
import { VotePlain, VoteEncrypted } from "../../shared/models/vote.model";
import { arrayBufferToBase64, base64ToArrayBuffer } from "../utils/base64.util";

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

    async exportKeyToBase64(key: CryptoKey): Promise<string> {
        const raw = await crypto.subtle.exportKey('raw', key);
        return arrayBufferToBase64(raw);
    }

    async importKeyFromBase64(rawKeyBase64: string): Promise<CryptoKey> {
        const raw = base64ToArrayBuffer(rawKeyBase64);

        return crypto.subtle.importKey(
            'raw',
            raw,
            {
                name: 'AES-GCM',
                length: 256
            },
            true,
            ['encrypt', 'decrypt']
        ) as Promise<CryptoKey>;
    }

    async encryptVote(key: CryptoKey, votePlain: VotePlain): Promise<VoteEncrypted> {
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encoded = new TextEncoder().encode(JSON.stringify(votePlain));

        const ciphertext = await crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv
            },
            key,
            encoded
        );

        return {
            ciphertextBase64: arrayBufferToBase64(ciphertext),
            ivBase64: arrayBufferToBase64(iv.buffer)
        };
    }

    async decryptVote(key: CryptoKey, encryptedVote: VoteEncrypted): Promise<string> {
        const iv = base64ToArrayBuffer(encryptedVote.ivBase64);
        const ciphertext = base64ToArrayBuffer(encryptedVote.ciphertextBase64);

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