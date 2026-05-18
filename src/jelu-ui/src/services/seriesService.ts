import axios from "axios";
import { Page } from "../model/Page";
import { Book } from "../model/Book";
import { Series, SeriesUpdate } from "../model/Series";
import { LibraryFilter } from "../model/LibraryFilter";
import { ReadingEventType } from "../model/ReadingEvent";
import { createApiClient } from "./apiClientFactory";

class SeriesService {
    private client = createApiClient();

    findSeriesByCriteria = async (query?: string | null): Promise<Page<Series>> => {
        try {
            const response = await this.client.get<Page<Series>>("/series", {
                params: { name: query }
            });
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                // intentionally empty catch
            }
            throw new Error("error get series by criteria " + error);
        }
    };

    getSeriesById = async (seriesId: string): Promise<Series> => {
        try {
            const response = await this.client.get<Series>(`/series/${seriesId}`);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                // intentionally empty catch
            }
            throw new Error("error get series by id " + error);
        }
    };

    getSeriesBooksById = async (
        seriesId: string, page?: number, size?: number, sort?: string,
        libraryFilter?: LibraryFilter, lastEventTypes?: Array<ReadingEventType> | null
    ): Promise<Page<Book>> => {
        try {
            const response = await this.client.get<Page<Book>>(`/series/${seriesId}/books`, {
                params: { page, size, sort, libraryFilter, lastEventTypes }
            });
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                // intentionally empty catch
            }
            throw new Error("error get series books by id " + error);
        }
    };

    getOrphanSeries = async (page?: number, size?: number, sort?: string): Promise<Page<Series>> => {
        try {
            const response = await this.client.get<Page<Series>>("/series/orphans", {
                params: { page, size, sort }
            });
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                // intentionally empty catch
            }
            throw new Error("error get orphan series " + error);
        }
    };

    deleteSeries = async (seriesId: string): Promise<void> => {
        try {
            const response = await this.client.delete(`/series/${seriesId}`);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                throw new Error("error deleting series " + error.response.status + " " + error);
            }
            throw new Error("error deleting series " + error);
        }
    };

    updateSeries = async (seriesId: string, updateDto: SeriesUpdate): Promise<Series> => {
        try {
            const response = await this.client.put<Series>(`/series/${seriesId}`, updateDto);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                throw new Error("error updating series " + error.response.status + " " + error);
            }
            throw new Error("error updating series " + error);
        }
    };
}

export const seriesService = new SeriesService();