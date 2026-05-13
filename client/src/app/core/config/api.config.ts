const ANCC_PORTS: Record<string, number> = {
    es: 3001,
    fr: 3002,
    de: 3003,
    pt: 3004,
    it: 3005
};

const DEFAULT_COUNTRY = "es";

export function getCurrentCountry(): string {
    return (
        localStorage.getItem("tfg_country") ??
        DEFAULT_COUNTRY
    ).toLowerCase();
}

export function getAnccPort(country = getCurrentCountry()): number {
    return ANCC_PORTS[country.toLowerCase()] ?? ANCC_PORTS[DEFAULT_COUNTRY];
}

export function getApiBaseUrl(country = getCurrentCountry()): string {
    return `http://localhost:${getAnccPort(country)}/api`;
}

export function getWsUrl(country = getCurrentCountry()): string {
    return `ws://localhost:${getAnccPort(country)}/signaling`;
}

export const API_CONFIG = {
    get BASE_URL(): string {
        return getApiBaseUrl();
    },

    get WS_URL(): string {
        return getWsUrl();
    }
};