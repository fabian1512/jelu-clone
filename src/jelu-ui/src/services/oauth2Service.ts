import { OAuth2ClientDto } from "../model/oauth-client-dto";
import { createApiClient } from "./apiClientFactory";

class OAuth2Service {
    private client = createApiClient();

    oauth2Providers = async (): Promise<OAuth2ClientDto[]> => {
        const response = await this.client.get<OAuth2ClientDto[]>("/oauth2/providers");
        return response.data;
    };
}

export const oauth2Service = new OAuth2Service();