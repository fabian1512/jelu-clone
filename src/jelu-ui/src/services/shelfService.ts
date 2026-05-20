import axios from "axios";
import { Page } from "../model/Page";
import { Shelf } from "../model/Shelf";
import { createApiClient } from "./apiClientFactory";

class ShelfService {
    private client = createApiClient();

    shelves = async (name?: string, targetId?: string, page?: number, size?: number, sort?: string, signal?: AbortSignal): Promise<Page<Shelf>> => {
        try {
            const response = await this.client.get<Page<Shelf>>("/shelves", {
                params: { name, targetId, page, size, sort },
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
            throw new Error("error shelves " + error);
        }
    };

    deleteShelf = async (shelfId?: string): Promise<void> => {
        try {
            const response = await this.client.delete(`/shelves/${shelfId}`);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                // intentionally empty catch
            }
            throw new Error("error delete shelves " + error);
        }
    };

    saveShelf = async (shelf: Shelf): Promise<Shelf> => {
        try {
            const resp = await this.client.post<Shelf>("/shelves", shelf);
            return resp.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                throw new Error("error creating shelf " + error.response.status + " " + error);
            }
            throw new Error("error creating event " + error);
        }
    };
}

export const shelfService = new ShelfService();