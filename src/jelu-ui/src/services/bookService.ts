import axios from "axios";
import qs from "qs";
import { Book } from "../model/Book";
import { Page } from "../model/Page";
import { LibraryFilter } from "../model/LibraryFilter";
import { ReadingEventType } from "../model/ReadingEvent";
import { createApiClient } from "./apiClientFactory";
import { StringUtils } from "../utils/StringUtils";

class BookService {
    private client = createApiClient();

    saveBook = async (book: Book): Promise<Book> => {
        try {
            const resp = await this.client.post<Book>("/books", book);
            return resp.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                throw new Error("error saving book " + error.response.status + " " + error);
            }
            throw new Error("error saving book " + error);
        }
    };

    saveBookImage = async (book: Book, file: File | null, onUploadProgress: any): Promise<Book> => {
        try {
            const formData = new FormData();
            if (file != null) {
                formData.append("file", file);
            }
            formData.append("book", new Blob([JSON.stringify(book)], {
                type: "application/json"
            }));
            const resp = await this.client.post<Book>("/books", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    Accept: "application/json"
                },
                onUploadProgress
            });
            return resp.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                throw new Error("error saving book " + error.response.status + " " + error);
            }
            throw new Error("error saving book " + error);
        }
    };

    findBooksDetailed = async (
        title?: string, isbn10?: string, isbn13?: string,
        series?: string, authors?: Array<string>, translators?: Array<string>,
        narrators?: Array<string>,
        tags?: Array<string>, page?: number, size?: number, sort?: string,
        libraryFilter?: LibraryFilter
    ): Promise<Page<Book>> => {
        try {
            const response = await this.client.get<Page<Book>>("/books", {
                params: {
                    isbn10, title, isbn13, series, authors, translators, narrators,
                    tags, page, size, sort, libraryFilter
                },
                paramsSerializer: {
                    serialize: (params) => qs.stringify(params, { arrayFormat: "comma" })
                }
            });
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                // intentionally empty catch
            }
            throw new Error("error find books " + error);
        }
    };

    findBooks = async (
        query?: string, page?: number, size?: number, sort?: string,
        libraryFilter?: LibraryFilter, lastEventTypes?: Array<ReadingEventType> | null,
        toRead?: boolean | null, owned?: boolean | null, borrowed?: boolean | null,
        signal?: AbortSignal
    ): Promise<Page<Book>> => {
        try {
            const response = await this.client.get<Page<Book>>("/books", {
                params: { q: query, page, size, sort, libraryFilter, lastEventTypes, toRead, owned, borrowed },
                paramsSerializer: {
                    serialize: (params) => qs.stringify(params, { arrayFormat: "comma" })
                },
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
            throw new Error("error find books " + error);
        }
    };

    deleteBook = async (bookId: string): Promise<void> => {
        try {
            const response = await this.client.delete(`/books/${bookId}`);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                // intentionally empty catch
            }
            throw new Error("error delete book " + error);
        }
    };

    updateBook = async (bookId: string, bookUpdateDto: Book): Promise<Book> => {
        try {
            const response = await this.client.put<Book>(`/books/${bookId}`, bookUpdateDto);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                // intentionally empty catch
            }
            throw new Error("error update book " + error);
        }
    };

    findBookById = async (bookId: string): Promise<Book> => {
        try {
            const response = await this.client.get<Book>(`/books/${bookId}`);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                // intentionally empty catch
            }
            throw new Error("error book by id " + error);
        }
    };

    checkIsbnExists = async (isbn10?: string, isbn13?: string): Promise<Book | null> => {
        if (StringUtils.isNotBlank(isbn10)) {
            const res = await this.findBooks(`isbn:${isbn10}`);
            if (!res.empty) {
                return res.content[0];
            }
        }
        if (StringUtils.isNotBlank(isbn13)) {
            const res = await this.findBooks(`isbn:${isbn13}`);
            if (!res.empty) {
                return res.content[0];
            }
        }
        return null;
    };
}

export const bookService = new BookService();