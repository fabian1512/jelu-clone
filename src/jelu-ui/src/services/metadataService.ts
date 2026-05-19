import axios from "axios";
import { Metadata } from "../model/Metadata";
import { MetadataRequest } from "../model/MetadataRequest";
import { createApiClient } from "./apiClientFactory";

class MetadataService {
    private client = createApiClient();

    fetchMetadata = async (
        isbn?: string,
        title?: string,
        authors?: string
    ): Promise<Metadata | null> => {
        try {
            const response = await this.client.get<Metadata>("/metadata", {
                params: { isbn, title, authors }
            });
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                // intentionally empty catch
            }
            throw new Error("error fetch metadata " + error);
        }
    };

    fetchMetadataWithPlugins = async (
        metadataRequest: MetadataRequest
    ): Promise<Metadata> => {
        try {
            const response = await this.client.post<Metadata>("/metadata", metadataRequest);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                // intentionally empty catch
            }
            throw new Error("error search metadata " + error);
        }
    };

    searchMetadataWithPlugins = async (
        metadataRequest: MetadataRequest
    ): Promise<Metadata[]> => {
        try {
            const response = await this.client.post<Metadata[]>("/metadata/search", metadataRequest);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                // intentionally empty catch
            }
            throw new Error("error search metadata " + error);
        }
    };
}

export const metadataService = new MetadataService();