import axios from "axios";
import { Page } from "../model/Page";
import { createApiClient } from "./apiClientFactory";

class PublisherService {
    private client = createApiClient();

    findPublisherByCriteria = async (query?: string | null): Promise<Page<string>> => {
        try {
            const response = await this.client.get<Page<string>>("/books/publishers", {
                params: { name: query }
            });
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                // intentionally empty catch
            }
            throw new Error("error get publishers by criteria " + error);
        }
    };
}

export const publisherService = new PublisherService();