import argon2 from "argon2";

// https://www.rfc-editor.org/rfc/rfc9106.html 7.4 Recommended Parameters
const ARGON2_RFC_9106_LOW_MEMORY_OPTIONS = {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4
};

export async function hashSecretCode(secretCode) {
    return await argon2.hash(secretCode, ARGON2_RFC_9106_LOW_MEMORY_OPTIONS);
}

export async function verifySecretCode(hash, secretCode) {
    return await argon2.verify(hash, secretCode, ARGON2_RFC_9106_LOW_MEMORY_OPTIONS);
}