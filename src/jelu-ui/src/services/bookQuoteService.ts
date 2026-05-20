import axios from "axios";
import { Page } from "../model/Page";
import { BookQuote, CreateBookQuoteDto, UpdateBookQuoteDto } from "../model/BookQuote";
import { Visibility } from "../model/Review";
import { createApiClient } from "./apiClientFactory";

class BookQuoteService {
    private client = createApiClient();

    saveBookQuote = async (quote: CreateBookQuoteDto): Promise<BookQuote> => {
        try {
            const resp = await this.client.post<BookQuote>("/book-quotes", quote);
            return resp.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                throw new Error("error creating book quote " + error.response.status + " " + error);
            }
            throw new Error("error creating book quote " + error);
        }
    };

    findBookQuotes = async (
        userId?: string, bookId?: string, visibility: Visibility | null = null,
        page?: number, size?: number, sort?: string,
        signal?: AbortSignal
    ): Promise<Page<BookQuote>> => {
        try {
            const response = await this.client.get<Page<BookQuote>>("/book-quotes", {
                params: { userId, bookId, visibility, page, size, sort },
                signal
            });
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.code === "ERR_CANCELED") {
                throw error;
            }
            if (axios.isAxiosError(error) && error.response) {
                // intentionally empty catch
            }
            throw new Error("error book quotes " + error);
        }
    };

    deleteBookQuote = async (quoteId: string): Promise<void> => {
        try {
            await this.client.delete(`/book-quotes/${quoteId}`);
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                throw new Error("error deleting book quote " + error.response.status + " " + error);
            }
            throw new Error("error deleting book quote " + error);
        }
    };

    updateBookQuote = async (quoteId: string, updateDto: UpdateBookQuoteDto): Promise<BookQuote> => {
        try {
            const response = await this.client.put<BookQuote>(`/book-quotes/${quoteId}`, updateDto);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                throw new Error("error updating book quote " + error.response.status + " " + error);
            }
            throw new Error("error updating book quote " + error);
        }
    };
}

export const bookQuoteService = new BookQuoteService();