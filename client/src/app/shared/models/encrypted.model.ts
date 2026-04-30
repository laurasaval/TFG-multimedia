export interface EncryptedResult {
    ivBase64: string;
    ciphertextBase64: string;
}

export interface EncryptedEnvelope extends EncryptedResult {
    encryptedKeyBase64: string;
}