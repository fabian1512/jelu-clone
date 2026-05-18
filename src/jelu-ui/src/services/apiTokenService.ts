import { ApiToken, ApiTokenCreated, CreateApiToken, TokenScope, UpdateApiToken } from "../model/ApiToken";
import { createApiClient } from "./apiClientFactory";

class ApiTokenService {
    private client = createApiClient();

    getApiTokens = async (): Promise<ApiToken[]> => {
        const response = await this.client.get<ApiToken[]>("/api-tokens");
        return response.data;
    };

    getApiTokenScopes = async (): Promise<TokenScope[]> => {
        const response = await this.client.get<TokenScope[]>("/api-tokens/scopes");
        return response.data;
    };

    createApiToken = async (token: CreateApiToken): Promise<ApiTokenCreated> => {
        const response = await this.client.post<ApiTokenCreated>("/api-tokens", token);
        return response.data;
    };

    updateApiToken = async (tokenId: string, token: UpdateApiToken): Promise<ApiToken> => {
        const response = await this.client.put<ApiToken>(`/api-tokens/${tokenId}`, token);
        return response.data;
    };

    deleteApiToken = async (tokenId: string): Promise<void> => {
        await this.client.delete(`/api-tokens/${tokenId}`);
    };
}

export const apiTokenService = new ApiTokenService();