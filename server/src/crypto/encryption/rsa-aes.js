import {
	randomBytes,
	createCipheriv,
	publicEncrypt,
	constants,
	generateKeyPairSync,
	privateDecrypt,
	createDecipheriv
} from "crypto";

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

	const ciphertext = Buffer.concat([
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

	// Lo unimos para que sea compatible con Web Crypto que espera ciphertext + authTag juntos
	const ciptherTextWithTag = Buffer.concat([ciphertext, authTag]);

	return {
		encryptedKeyBase64: encryptedAesKey.toString("base64"),
		ivBase64: iv.toString("base64"),
		ciphertextBase64: ciptherTextWithTag.toString("base64")
	};
}

export function decryptJsonWithPrivateKey(encrypted, privateKeyPem, passphrase) {
	const aesKey = privateDecrypt(
		{
			key: privateKeyPem,
			passphrase,
			padding: constants.RSA_PKCS1_OAEP_PADDING,
			oaepHash: "sha256"
		},
		Buffer.from(encrypted.encryptedKeyBase64, "base64")
	);

	const encryptedBuffer = Buffer.from(encrypted.ciphertextBase64, "base64");

	// Web Crypto devuelve ciphertext + authTag juntos.
	// En AES-GCM el tag son los últimos 16 bytes.
	const authTag = encryptedBuffer.subarray(encryptedBuffer.length - 16);
	const ciphertext = encryptedBuffer.subarray(0, encryptedBuffer.length - 16);

	const decipher = createDecipheriv(
		"aes-256-gcm",
		aesKey,
		Buffer.from(encrypted.ivBase64, "base64")
	);

	decipher.setAuthTag(authTag);

	const plaintext = Buffer.concat([
		decipher.update(ciphertext),
		decipher.final()
	]);

	return JSON.parse(plaintext.toString("utf-8"));
}