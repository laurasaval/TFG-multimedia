import dotenv from "dotenv";
import fs from "fs";
import path from "path";

import { generateRSAOAEPKeyPair } from "../src/crypto/encryption/rsa-aes.js";
import { getCountryKeysPath } from "../src/config/paths.js";

const country = process.argv[2];

if (!country) {
    console.error("Error: Debes especificar el país");
    process.exit(1);
}

const result = dotenv.config({ path: `./env/.${country}.env` });

if (result.error) {
    console.error(`Error al cargar el archivo .${country}.env:`, result.error);
    process.exit(1);
}

const passphrase = process.env.COUNTRY_ENCRYPTION_KEY_PASSPHRASE;
const countryName = process.env.COUNTRY_NAME;

if (!passphrase) {
    console.error("Error: No se ha especificado COUNTRY_ENCRYPTION_KEY_PASSPHRASE");
    process.exit(1);
}

const { publicKey, privateKey } = generateRSAOAEPKeyPair({ passphrase });

const countryDir = getCountryKeysPath(country);

fs.mkdirSync(countryDir, { recursive: true });

fs.writeFileSync(path.join(countryDir, "encryption-public.pem"), publicKey);
fs.writeFileSync(path.join(countryDir, "encryption-private.pem"), privateKey);

console.log(
    `Claves RSA-OAEP del país ${countryName} (${country}) generadas exitosamente en ${countryDir}`
);

process.exit(0);