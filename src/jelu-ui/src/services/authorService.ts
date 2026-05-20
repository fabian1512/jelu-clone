import axios from "axios";
import dayjs from "dayjs";
import qs from "qs";
import { Page } from "../model/Page";
import { Author } from "../model/Author";
import { Book } from "../model/Book";
import { LibraryFilter } from "../model/LibraryFilter";
import { Role } from "../model/Role";
import { ReadingEventType } from "../model/ReadingEvent";
import { createApiClient } from "./apiClientFactory";

class AuthorService {
    private client = createApiClient();

    private transformAuthor = (data: string) => {
        const tr = JSON.parse(data);
        if (tr.dateOfBirth != null) {
            tr.dateOfBirth = dayjs(tr.dateOfBirth).toDate();
        }
        if (tr.dateOfDeath != null) {
            tr.dateOfDeath = dayjs(tr.dateOfDeath).toDate();
        }
        return tr;
    };

    findAuthorByCriteria = async (
        role: Role, query?: string | null,
        page: number = 0, size: number = 0,
        sort: string | null = null, libraryFilter?: LibraryFilter,
        signal?: AbortSignal
    ): Promise<Page<Author>> => {
        try {
            const response = await this.client.get<Page<Author>>("/authors", {
                params: { role, name: query, page, size, sort, libraryFilter },
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
            throw new Error("error get authors by criteria " + error);
        }
    };

    getAuthorById = async (authorId: string): Promise<Author> => {
        try {
            const response = await this.client.get<Author>(`/authors/${authorId}`, {
                transformResponse: this.transformAuthor
            });
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                // intentionally empty catch
            }
            throw new Error("error get author by id " + error);
        }
    };

    getAuthorBooksById = async (
        authorId: string, page?: number, size?: number, sort?: string,
        libraryFilter?: LibraryFilter, lastEventTypes?: Array<ReadingEventType> | null,
        signal?: AbortSignal
    ): Promise<Page<Book>> => {
        try {
            const response = await this.client.get<Page<Book>>(`/authors/${authorId}/books`, {
                params: { page, size, sort, libraryFilter, lastEventTypes },
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
            throw new Error("error get author books by id " + error);
        }
    };

    getOrphanAuthors = async (page?: number, size?: number, sort?: string, signal?: AbortSignal): Promise<Page<Author>> => {
        try {
            const response = await this.client.get<Page<Author>>("/authors/orphans", {
                params: { page, size, sort },
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
            throw new Error("error get author orphans " + error);
        }
    };

    deleteAuthor = async (authorId: string): Promise<void> => {
        try {
            const response = await this.client.delete(`/authors/${authorId}`);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                throw new Error("error deleting author " + error.response.status + " " + error);
            }
            throw new Error("error deleting author " + error);
        }
    };

    updateAuthor = async (author: Author, file: File | null, onUploadProgress?: any): Promise<Author> => {
        try {
            const formData = new FormData();
            if (file != null) {
                formData.append("file", file);
            }
            formData.append("author", new Blob([JSON.stringify(author)], {
                type: "application/json"
            }));
            const resp = await this.client.put<Author>(`/authors/${author.id}`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    Accept: "application/json"
                },
                onUploadProgress
            });
            return resp.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                throw new Error("error updating author " + error.response.status + " " + error);
            }
            throw new Error("error updating author " + error);
        }
    };

    mergeAuthors = async (authorId: string, otherId: string, authorDto: Author): Promise<Author> => {
        try {
            const resp = await this.client.put<Author>(`/authors/${authorId}/merge/${otherId}`, authorDto);
            return resp.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                throw new Error("error merging authors " + error.response.status + " " + error);
            }
            throw new Error("error merging authors " + error);
        }
    };
}

export const authorService = new AuthorService();