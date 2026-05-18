import { createApiClient } from "./apiClientFactory";

class MetadataProviderService {
    private client = createApiClient();

    fetchMetadataProviders = async (): Promise<any[]> => {
        const response = await this.client.get<any[]>("/metadata-providers");
        return response.data;
    };

    saveMetadataProviders = async (providers: any[]): Promise<void> => {
        await this.client.put("/metadata-providers", { providers });
    };
}

export const metadataProviderService = new MetadataProviderService();