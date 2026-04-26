import { Injectable } from "@angular/core";

@Injectable({
    providedIn: 'root'
})
export class WebCryptoEd25519Service {
    async importPublicKeyFromPem(pem: string): Promise<CryptoKey> {
        const cleanPem = this.strimPemHeaders(pem);
        const binary = this.base64ToArrayBuffer(cleanPem);

        return await crypto.subtle.importKey(
            'spki',
            binary,
            { name: 'Ed25519' },
            false,
            ['verify']
        );
    }

    async importPrivateKeyFromPem(pem: string): Promise<CryptoKey> {
        const cleanPem = this.strimPemHeaders(pem);
        const binary = this.base64ToArrayBuffer(cleanPem);

        return await crypto.subtle.importKey(
            'pkcs8',
            binary,
            { name: 'Ed25519' },
            false,
            ['sign']
        );
    }

    async generateVoteKeyPair(): Promise<CryptoKeyPair> {
        return await crypto.subtle.generateKey(
            { name: 'Ed25519' },
            true,
            ['sign', 'verify']
        );
    }

    async exportPublicKeyToPem(publicKey: CryptoKey): Promise<string> {
        const skpi = await crypto.subtle.exportKey('spki', publicKey);
        const base64 = this.arrayBufferToBase64(skpi);

        return this.wrapPem(base64, 'PUBLIC KEY');
    }

    async exportPrivateKeyToPem(privateKey: CryptoKey): Promise<string> {
        const pkcs8 = await crypto.subtle.exportKey('pkcs8', privateKey);
        const base64 = this.arrayBufferToBase64(pkcs8);

        return this.wrapPem(base64, 'PRIVATE KEY');
    }

    async signToBase64(privateKey: CryptoKey, data: string): Promise<string> {
        const signature = await crypto.subtle.sign(
            { name: 'Ed25519' },
            privateKey,
            new TextEncoder().encode(data)
        );

        return this.arrayBufferToBase64(signature);
    }

    async verifySignature(publicKey: CryptoKey, data: string, signature: string): Promise<boolean> {
        const signatureBuffer = this.base64ToArrayBuffer(signature);
        const dataBuffer = new TextEncoder().encode(data);

        return await crypto.subtle.verify(
            { name: 'Ed25519' },
            publicKey,
            signatureBuffer,
            dataBuffer
        );
    }

    private wrapPem(base64: string, label: string): string {
        const lines = base64.match(/.{1,64}/g);
        if (!lines) {
            return '';
        }

        return `-----BEGIN ${label}-----\n${lines.join('\n')}\n-----END ${label}-----`;
    }

    private arrayBufferToBase64(buffer: ArrayBuffer): string {
        const bytes = new Uint8Array(buffer);
        let binary = '';

        bytes.forEach((byte) => {
            binary += String.fromCharCode(byte);
        });

        return btoa(binary);
    }


    private base64ToArrayBuffer(base64: string): ArrayBuffer {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);

        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }

        return bytes.buffer;
    }

    private strimPemHeaders(pem: string): string {
        return pem
            .replace(/-----BEGIN [^-]+-----/g, '')
            .replace(/-----END [^-]+-----/g, '')
            .replace(/\s+/g, '');
    }
}
