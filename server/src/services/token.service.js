import dotenv from "dotenv";
import fs from "fs";
import { randomBytes, randomUUID } from "crypto";
import { canonicalJson } from "../../../shared/utils/canonical-json.util.js";
import { findVoterById, updateVoterAfterTokenCreation } from "../repositories/voter.repository.js";
import { signEd25519, verifyEd25519 } from "../crypto/signatures/ed22519.js";
import { createTokenRequestPayload, createIssuedTokenPayload } from "./token-payload.service.js";
import { getCountryEncryptionPrivateKeyPath, getCountryPrivateKeyPath } from "../config/paths.js";
import { encryptJsonForPublicKey, decryptJsonWithPrivateKey } from "../crypto/encryption/rsa-aes.js";

dotenv.config();

export async function requestToken({
    encryptedKeyBase64,
    ivBase64,
    ciphertextBase64,
    authenticatedVoterId
}) {
    const countryCode = process.env.COUNTRY_CODE?.toLowerCase();
    const passphrase = process.env.COUNTRY_KEY_PASSPHRASE;
    const encryptionPassphrase = process.env.COUNTRY_ENCRYPTION_KEY_PASSPHRASE;

    if (!countryCode) {
        throw new Error("No se ha especificado el código del país");
    }

    if (!passphrase) {
        throw new Error("No se ha especificado la passphrase");
    }

    if (!encryptionPassphrase) {
        throw new Error("COUNTRY_ENCRYPTION_KEY_PASSPHRASE no está configurada");
    }

    if (!encryptedKeyBase64 || !ivBase64 || !ciphertextBase64 || !authenticatedVoterId) {
        return {
            ok: false,
            message: "No se ha proporcionado toda la información necesaria para generar el token"
        };
    }

    const countryEncryptionPrivateKeyPath = getCountryEncryptionPrivateKeyPath(countryCode);

    if (!fs.existsSync(countryEncryptionPrivateKeyPath)) {
        throw new Error("No se ha encontrado la clave privada RSA-OAEP del país");
    }

    const countryEncryptionPrivateKeyPem = fs.readFileSync(countryEncryptionPrivateKeyPath, "utf-8");
    const encryptedRequest = {
        encryptedKeyBase64,
        ivBase64,
        ciphertextBase64
    }

    const decryptedEnvelope = decryptJsonWithPrivateKey(
        encryptedRequest,
        countryEncryptionPrivateKeyPem,
        encryptionPassphrase
    );

    const {
        voterId,
        voteSigningPublicKey,
        voterSigningPublicKey,
        voterEncryptionPublicKey,
        requestedAt,
        identitySignature
    } = decryptedEnvelope;

    if (!voterId || !voteSigningPublicKey || !voterSigningPublicKey ||
        !voterEncryptionPublicKey || !requestedAt || !identitySignature) {
        return {
            ok: false,
            message: "No se ha proporcionado toda la información necesaria para generar el token"
        };
    }

    if (voterId !== authenticatedVoterId) {
        return {
            ok: false,
            message: "El votante de la solicitud no coincide con el votante autenticado"
        };
    }

    const voter = await findVoterById(voterId);

    if (!voter) {
        return {
            ok: false,
            message: "No se ha encontrado el votante"
        };
    }

    const requestPayload = createTokenRequestPayload({
        voterId,
        voteSigningPublicKey,
        voterSigningPublicKey,
        voterEncryptionPublicKey,
        requestedAt
    });

    const canonicalRequestPayload = canonicalJson(requestPayload);
    const identitySignatureBuffer = Buffer.from(identitySignature, "base64");

    const isValidIdentitySignature = verifyEd25519(
        voter.identityPublicKey,
        canonicalRequestPayload,
        identitySignatureBuffer
    );

    if (!isValidIdentitySignature) {
        return {
            ok: false,
            message: "La firma de la identidad no es válida"
        };
    }

    const tokenId = randomUUID();
    const token = randomBytes(32).toString("hex");
    const issuedAt = new Date().toISOString();
    const used = false;

    const issuedTokenPayload = createIssuedTokenPayload({
        tokenId,
        token,
        voterSigningPublicKey,
        issuedAt,
        used
    });

    const canonicalIssuedTokenPayload = canonicalJson(issuedTokenPayload);

    const countryPrivateKeyPath = getCountryPrivateKeyPath(countryCode);

    if (!fs.existsSync(countryPrivateKeyPath)) {
        throw new Error("No se ha encontrado la clave privada del país");
    }

    const countryPrivateKeyPem = fs.readFileSync(countryPrivateKeyPath, "utf-8");

    const anccSignature = signEd25519(
        {
            key: countryPrivateKeyPem,
            passphrase
        },
        canonicalIssuedTokenPayload
    ).toString("base64");

    const issuedToken = {
        tokenId,
        token,
        voterSigningPublicKey,
        issuedAt,
        used,
        anccSignature
    };

    const encryptedToken = encryptJsonForPublicKey(
        issuedToken,
        voterEncryptionPublicKey
    );

    await updateVoterAfterTokenCreation(voterId, encryptedToken, voterEncryptionPublicKey, voteSigningPublicKey);

    return {
        ok: true,
        message: "Token generado exitosamente",
        encryptedToken: encryptedToken
    };
}