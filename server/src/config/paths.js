import path from "path";

export function getProyectRoot() {
    return path.join(process.cwd(), "..");
}

export function getKeysPath() {
    return path.join(getProyectRoot(), "keys");
}

export function getCountryKeysPath(country) {
    return path.join(getKeysPath(), "countries", country);
}

export function getCountryPublicKeyPath(country) {
    return path.join(getCountryKeysPath(country), "public.pem");
}

export function getCountryPrivateKeyPath(country) {
    return path.join(getCountryKeysPath(country), "private.pem");
}

export function getCountryEncryptionPrivateKeyPath(country) {
    return path.join(getCountryKeysPath(country), "encryption-private.pem");
}

export function getVoterKeysPath(country) {
    return path.join(getKeysPath(), "voters", country);
}