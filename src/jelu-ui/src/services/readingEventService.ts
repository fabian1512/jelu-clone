import axios from "axios";
import dayjs from "dayjs";
import qs from "qs";
import { CreateReadingEvent, ReadingEvent, ReadingEventType, ReadingEventWithUserBook } from "../model/ReadingEvent";
import { Page } from "../model/Page";
import { createApiClient } from "./apiClientFactory";

class ReadingEventService {
    private client = createApiClient();

    private transformReadingEvents = (data: string) => {
        const page = JSON.parse(data);
        if (page.content) {
            for (const ev of page.content) {
                if (ev.modificationDate != null) {
                    ev.modificationDate = dayjs(ev.modificationDate).toDate();
                }
                if (ev.startDate != null) {
                    ev.startDate = dayjs(ev.startDate).toDate();
                }
                if (ev.endDate != null) {
                    ev.endDate = dayjs(ev.endDate).toDate();
                }
            }
        }
        return page;
    };

    deleteReadingEvent = async (eventId: string): Promise<void> => {
        try {
            const response = await this.client.delete(`/reading-events/${eventId}`);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                // intentionally empty catch
            }
            throw new Error("error delete event " + error);
        }
    };

    myReadingEvents = async (
        eventTypes?: Array<ReadingEventType> | null, bookId?: string,
        startedAfter?: string, startedBefore?: string,
        endedAfter?: string, endedBefore?: string,
        page?: number, size?: number, sort?: string,
        signal?: AbortSignal
    ): Promise<Page<ReadingEventWithUserBook>> => {
        try {
            const response = await this.client.get<Page<ReadingEventWithUserBook>>(`/reading-events/me`, {
                params: {
                    eventTypes,
                    bookId,
                    startedAfter,
                    startedBefore,
                    endedAfter,
                    endedBefore,
                    page,
                    size,
                    sort,
                },
                paramsSerializer: {
                    serialize: (params) => qs.stringify(params, { arrayFormat: "comma" })
                },
                transformResponse: this.transformReadingEvents,
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
            throw new Error("error reading events " + error);
        }
    };

    findReadingEvents = async (
        eventTypes?: Array<ReadingEventType> | null, userId?: string, bookId?: string,
        startedAfter?: string, startedBefore?: string,
        endedAfter?: string, endedBefore?: string,
        page?: number, size?: number, sort?: string,
        signal?: AbortSignal
    ): Promise<Page<ReadingEventWithUserBook>> => {
        try {
            const response = await this.client.get<Page<ReadingEventWithUserBook>>(`/reading-events`, {
                params: {
                    eventTypes,
                    userId,
                    bookId,
                    startedAfter,
                    startedBefore,
                    endedAfter,
                    endedBefore,
                    page,
                    size,
                    sort,
                },
                paramsSerializer: {
                    serialize: (params) => qs.stringify(params, { arrayFormat: "comma" })
                },
                transformResponse: this.transformReadingEvents,
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
            throw new Error("error reading events " + error);
        }
    };

    updateReadingEvent = async (event: ReadingEvent): Promise<ReadingEvent> => {
        try {
            const resp = await this.client.put<ReadingEvent>(`/reading-events/${event.id}`, {
                eventType: event.eventType,
                startDate: event.startDate,
                eventDate: event.endDate,
                text: event.text,
                userBookId: event.userBook,
                id: event.id,
                creationDate: event.creationDate,
                modificationDate: event.modificationDate,
                percent: event.percent,
                progress: event.progress,
            });
            return resp.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                throw new Error("error update event " + error.response.status + " " + error);
            }
            throw new Error("error update event " + error);
        }
    };

    createReadingEvent = async (event: CreateReadingEvent): Promise<ReadingEvent> => {
        try {
            const resp = await this.client.post<ReadingEvent>(`/reading-events`, event);
            return resp.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                throw new Error("error creating event " + error.response.status + " " + error);
            }
            throw new Error("error creating event " + error);
        }
    };
}

export const readingEventService = new ReadingEventService();
