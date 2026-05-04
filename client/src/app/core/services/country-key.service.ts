import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { COUNTRY_PUBLIC_KEYS } from "../keys";

@Injectable({
    providedIn: "root"
})
export class CountryKeyService {
    constructor(private http: HttpClient) { }

    getCountryEncryptionPublicKey(countryCode: string): string {
        const keys = COUNTRY_PUBLIC_KEYS[countryCode as keyof typeof COUNTRY_PUBLIC_KEYS];

        if (!keys) {
            throw new Error(`No hay claves públicas para el país: ${countryCode}`);
        }

        return keys.rsaEncryptionPublicKey;
    }

    getCountrySigningPublicKey(countryCode: string): string {
        const keys = COUNTRY_PUBLIC_KEYS[countryCode as keyof typeof COUNTRY_PUBLIC_KEYS];

        if (!keys) {
            throw new Error(`No hay claves públicas para el país: ${countryCode}`);
        }

        return keys.ed25519SigningPublicKey;
    }
}