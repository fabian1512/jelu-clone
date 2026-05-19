import axios from "axios";
import qs from "qs";
import { Tag } from "../model/Tag";
import { Book } from "../model/Book";
import { Page } from "../model/Page";
import { LibraryFilter } from "../model/LibraryFilter";
import { ReadingEventType } from "../model/ReadingEvent";
import { createApiClient } from "./apiClientFactory";

class TagService {
    private client = createApiClient();

    findTagsByCriteria = async (query?: string | null): Promise<Page<Tag>> => {
        try {
            const response = await this.client.get<Page<Tag>>("/tags", {
                params: { name: query }
            });
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                // intentionally empty catch
            }
            throw new Error("error get tags by criteria " + error);
        }
    };

    getTagById = async (tagId: string): Promise<Tag> => {
        try {
            const response = await this.client.get<Tag>(`/tags/${tagId}`);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                // intentionally empty catch
            }
            throw new Error("error get tag by id " + error);
        }
    };

    getTagBooksById = async (
        tagId: string,
        page?: number, size?: number, sort?: string,
        libraryFilter?: LibraryFilter,
        lastEventTypes?: Array<ReadingEventType> | null
    ): Promise<Page<Book>> => {
        try {
            const response = await this.client.get<Page<Book>>(`/tags/${tagId}/books`, {
                params: { page, size, sort, libraryFilter, lastEventTypes },
                paramsSerializer: {
                    serialize: (params) => qs.stringify(params, { arrayFormat: "comma" })
                }
            });
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                // intentionally empty catch
            }
            throw new Error("error get tag books by id " + error);
        }
    };

    getOrphanTags = async (page?: number, size?: number, sort?: string): Promise<Page<Tag>> => {
        try {
            const response = await this.client.get<Page<Tag>>("/tags/orphans", {
                params: { page, size, sort }
            });
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                // intentionally empty catch
            }
            throw new Error("error get tag orphans " + error);
        }
    };

    deleteTag = async (tagId: string): Promise<void> => {
        try {
            const response = await this.client.delete(`/tags/${tagId}`);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                // intentionally empty catch
            }
            throw new Error("error delete tag " + error);
        }
    };
}

export const tagService = new TagService();