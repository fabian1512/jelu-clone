import axios from "axios";
import { Page } from "../model/Page";
import { Book } from "../model/Book";
import { CustomList, CustomListRemoveDto } from "../model/custom-list";
import { createApiClient } from "./apiClientFactory";

class CustomListService {
    private client = createApiClient();

    saveCustomList = async (list: CustomList): Promise<CustomList> => {
        try {
            const resp = await this.client.post<CustomList>("/custom-lists", list);
            return resp.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                throw new Error("error creating custom list " + error.response.status + " " + error);
            }
            throw new Error("error creating custom list " + error);
        }
    };

    findCustomLists = async (
        name?: string, page?: number, size?: number, sort?: string | null,
        signal?: AbortSignal
    ): Promise<Page<CustomList>> => {
        try {
            const response = await this.client.get<Page<CustomList>>("/custom-lists", {
                params: { name, page, size, sort },
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
            throw new Error("error custom lists " + error);
        }
    };

    findCustomListById = async (listId: string): Promise<CustomList> => {
        try {
            const response = await this.client.get<CustomList>(`/custom-lists/${listId}`);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                // intentionally empty catch
            }
            throw new Error("error custom list " + error);
        }
    };

    deleteCustomList = async (listId: string): Promise<void> => {
        try {
            const response = await this.client.delete(`/custom-lists/${listId}`);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                throw new Error("error deleting custom list " + error.response.status + " " + error);
            }
            throw new Error("error deleting custom list " + error);
        }
    };

    booksForList = async (
        listId: string, page?: number, size?: number, sort?: string | null,
        signal?: AbortSignal
    ): Promise<Page<Book>> => {
        try {
            const response = await this.client.get<Page<Book>>(`/custom-lists/${listId}/books`, {
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
            throw new Error("error custom list books " + error);
        }
    };

    removeBooksFromList = async (customListRemoveDto: CustomListRemoveDto): Promise<void> => {
        try {
            const resp = await this.client.post("/custom-lists/remove", customListRemoveDto);
            return resp.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                throw new Error("error remove from list " + error.response.status + " " + error);
            }
            throw new Error("error remove from list " + error);
        }
    };
}

export const customListService = new CustomListService();