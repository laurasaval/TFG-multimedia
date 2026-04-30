import { Injectable } from "@angular/core";
import { WebCryptoAESGCMService } from "./web-crypto-aesgcm256.service";
import { WebCryptoRSAOAEPService } from "./web-crypto-rsaoaep.service";
import { EncryptedEnvelope } from "../../shared/models/encrypted.model";

@Injectable({
    providedIn: "root"
})
export class HybridCryptoService {
    constructor(
        private aesGcmService: WebCryptoAESGCMService,
        private rsaOaepService: WebCryptoRSAOAEPService
    ) { }

    async encryptJsonForPublicKey(
        data: unknown,
        publicKeyPem: string
    ): Promise<EncryptedEnvelope> {
        const rsaPublicKey = await this.rsaOaepService.importPublicKeyFromPem(publicKeyPem);

        const aesKey = await this.aesGcmService.generateKey();
        const rawAesKey = await this.aesGcmService.exportRawKey(aesKey);

        const encryptedPayload = await this.aesGcmService.encrypt(aesKey, data);

        const encryptedKeyBase64 = await this.rsaOaepService.encryptKey(
            rsaPublicKey,
            rawAesKey
        );

        return {
            encryptedKeyBase64,
            ivBase64: encryptedPayload.ivBase64,
            ciphertextBase64: encryptedPayload.ciphertextBase64
        };
    }
}