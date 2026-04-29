import { arrayBufferToBase64 } from "./base64.util"

export async function exportPublicKeyToPem(publicKey: CryptoKey): Promise<string> {
    const skpi = await crypto.subtle.exportKey('spki', publicKey);
    const base64 = arrayBufferToBase64(skpi);

    return wrapPem(base64, 'PUBLIC KEY');
}

export async function exportPrivateKeyToPem(privateKey: CryptoKey): Promise<string> {
    const pkcs8 = await crypto.subtle.exportKey('pkcs8', privateKey);
    const base64 = arrayBufferToBase64(pkcs8);

    return wrapPem(base64, 'PRIVATE KEY');
}

export function wrapPem(base64: string, label: string): string {
    const lines = base64.match(/.{1,64}/g);
    if (!lines) {
        return '';
    }

    return `-----BEGIN ${label}-----\n${lines.join('\n')}\n-----END ${label}-----`;
}

export function strimPemHeaders(pem: string): string {
    return pem
        .replace(/-----BEGIN [^-]+-----/g, '')
        .replace(/-----END [^-]+-----/g, '')
        .replace(/\s+/g, '');
}