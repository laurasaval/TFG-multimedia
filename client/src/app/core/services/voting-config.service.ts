import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { API_CONFIG } from "../config/api.config";
import { VotingConfig, VotingConfigResponse } from "../../shared/models/voting-config.models";

@Injectable({
    providedIn: "root"
})
export class VotingConfigService {
    private readonly apiUrl = `${API_CONFIG.BASE_URL}/voting-config`;

    constructor(private http: HttpClient) { }

    async getVotingConfig(): Promise<VotingConfig> {
        const response = await firstValueFrom(
            this.http.get<VotingConfigResponse>(this.apiUrl)
        );

        if (!response.ok || !response.voting) {
            throw new Error(response.message ?? "No se pudo cargar la votación");
        }

        return response.voting;
    }
}