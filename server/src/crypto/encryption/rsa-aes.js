import { randomBytes, createCipheriv, publicEncrypt, constants, generateKeyPairSync } from "crypto";

export function generateRSAOAEPKeyPair({ passphrase }) {
	const { publicKey, privateKey } = generateKeyPairSync("rsa", {
		modulusLength: 2048,
		publicExponent: 0x10001,
		publicKeyEncoding: {
			type: "spki",
			format: "pem"
		},
		privateKeyEncoding: {
			type: "pkcs8",
			format: "pem",
			cipher: "aes-256-cbc",
			passphrase
		}
	});

	return { publicKey, privateKey };
}

export function encryptJsonForPublicKey(data, publicKeyPem) {
	const aesKey = randomBytes(32);
	const iv = randomBytes(12);

	const cipher = createCipheriv("aes-256-gcm", aesKey, iv);
	const plaintext = Buffer.from(JSON.stringify(data), "utf-8");
	const encrypted = Buffer.concat([
		cipher.update(plaintext),
		cipher.final()
	]);

	const authTag = cipher.getAuthTag();

	const encryptedAesKey = publicEncrypt(
		{
			key: publicKeyPem,
			padding: constants.RSA_PKCS1_OAEP_PADDING,
			oaepHash: "sha256"
		},
		aesKey
	);

	return {
		encryptedKeyBase64: encryptedAesKey.toString("base64"),
		ivBase64: iv.toString("base64"),
		ciphertextBase64: encrypted.toString("base64"),
		authTagBase64: authTag.toString("base64")
	};
}