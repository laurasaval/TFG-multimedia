export interface AnccMirrorConfig {
    countryCode: string;
    countryName: string;
    baseUrl: string;
}

export const ANCC_MIRRORS: AnccMirrorConfig[] = [
    {
        countryCode: "ES",
        countryName: "España",
        baseUrl: "http://localhost:3001/api/blockchain"
    },
    {
        countryCode: "FR",
        countryName: "Francia",
        baseUrl: "http://localhost:3002/api/blockchain"
    },
    {
        countryCode: "DE",
        countryName: "Alemania",
        baseUrl: "http://localhost:3003/api/blockchain"
    },
    {
        countryCode: "PT",
        countryName: "Portugal",
        baseUrl: "http://localhost:3004/api/blockchain"
    },
    {
        countryCode: "IT",
        countryName: "Italia",
        baseUrl: "http://localhost:3005/api/blockchain"
    }
];