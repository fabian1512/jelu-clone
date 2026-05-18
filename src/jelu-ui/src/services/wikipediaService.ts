import axios from "axios";
import { WikipediaSearchResult } from "../model/WikipediaSearchResult";
import { WikipediaPageResult } from "../model/WikipediaPageResult";
import { createApiClient } from "./apiClientFactory";

class WikipediaService {
    private client = createApiClient();

    wikipediaSearch = async (query: string, language: string): Promise<WikipediaSearchResult> => {
        try {
            const response = await this.client.get<WikipediaSearchResult>("/wikipedia/search", {
                params: { query, language }
            });
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                // intentionally empty catch
            }
            throw new Error("error wikipedia search " + error);
        }
    };

    wikipediaPage = async (pageTitle: string, language: string): Promise<WikipediaPageResult> => {
        try {
            const response = await this.client.get<WikipediaPageResult>("/wikipedia/page", {
                params: { pageTitle, language }
            });
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                // intentionally empty catch
            }
            throw new Error("error wikipedia page " + error);
        }
    };
}

export const wikipediaService = new WikipediaService();