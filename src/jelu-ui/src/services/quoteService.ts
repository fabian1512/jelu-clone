import axios from "axios";
import { Quote } from "../model/Quote";
import { createApiClient } from "./apiClientFactory";

class QuoteService {
    private client = createApiClient();

    quotes = async (query?: string): Promise<Quote[]> => {
        try {
            const response = await this.client.get<Quote[]>("/quotes", {
                params: { query }
            });
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                // intentionally empty catch
            }
            throw new Error("error quotes " + error);
        }
    };

    randomQuotes = async (): Promise<Quote[]> => {
        try {
            const response = await this.client.get<Quote[]>("/quotes/random");
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                // intentionally empty catch
            }
            throw new Error("error quotes " + error);
        }
    };
}

export const quoteService = new QuoteService();