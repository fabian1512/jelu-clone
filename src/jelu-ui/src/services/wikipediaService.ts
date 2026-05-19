import { WikipediaSearchResult, WikipediaSearchResultElement } from "../model/WikipediaSearchResult";
import { WikipediaPageResult } from "../model/WikipediaPageResult";
import { createApiClient } from "./apiClientFactory";

class WikipediaService {
    private wikiClient = createApiClient();

    wikipediaSearch = async (
        query: string,
        language: string
    ): Promise<WikipediaSearchResult> => {
        try {
            const response = await this.wikiClient.get<WikipediaSearchResult>("/wikipedia/search", {
                params: { query, language }
            });
            return response.data;
        } catch (error) {
            throw new Error("error wikipedia search " + error);
        }
    };

    wikipediaPage = async (
        pageTitle: string,
        language: string
    ): Promise<WikipediaPageResult> => {
        try {
            const response = await this.wikiClient.get<WikipediaPageResult>("/wikipedia/page", {
                params: { pageTitle, language }
            });
            return response.data;
        } catch (error) {
            throw new Error("error wikipedia page " + error);
        }
    };
}

export const wikipediaService = new WikipediaService();