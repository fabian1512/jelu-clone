import { ServerSettings } from "../model/ServerSettings";
import { createApiClient } from "./apiClientFactory";

class ServerSettingsService {
    private client = createApiClient();

    getServerSettings = async (): Promise<ServerSettings> => {
        const response = await this.client.get<ServerSettings>("/server-settings");
        return response.data;
    };
}

export const serverSettingsService = new ServerSettingsService();