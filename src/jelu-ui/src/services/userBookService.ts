import axios from "axios";
import dayjs from "dayjs";
import qs from "qs";
import { UserBook, UserBookBulkUpdate, UserBookUpdate } from "../model/Book";
import { Page } from "../model/Page";
import { ReadingEventType } from "../model/ReadingEvent";
import { createApiClient } from "./apiClientFactory";

class UserBookService {
    private client = createApiClient();

    private transformUserbook = (data: string) => {
        const tr = JSON.parse(data);
        if (tr.readingEvents != null && tr.readingEvents.length > 0) {
            for (const ev of tr.readingEvents) {
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
        return tr;
    };

    getUserBookById = async (userBookId: string): Promise<UserBook> => {
        try {
            const response = await this.client.get<UserBook>(`/userbooks/${userBookId}`, {
                transformResponse: this.transformUserbook
            });
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                // intentionally empty catch
            }
            throw new Error("error finding userBook " + userBookId + " " + error);
        }
    };

    getBookAsUserBook = async (bookId: string): Promise<UserBook> => {
        try {
            const response = await this.client.get<UserBook>(`/userbooks/from-book/${bookId}`, {
                transformResponse: this.transformUserbook
            });
            return response.data;
        } catch (error) {
            throw new Error("error finding book as userbook " + bookId + " " + error);
        }
    };

    saveUserBookImage = async (userBook: UserBook, file: File | null, onUploadProgress: any): Promise<UserBook> => {
        try {
            const formData = new FormData();
            if (file != null) {
                formData.append("file", file);
            }
            formData.append("book", new Blob([JSON.stringify(userBook)], {
                type: "application/json"
            }));
            const resp = await this.client.post<UserBook>("/userbooks", formData, {
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

    updateUserBookImage = async (userBook: UserBook, file: File | null, onUploadProgress: any): Promise<UserBook> => {
        try {
            const formData = new FormData();
            if (file != null) {
                formData.append("file", file);
            }
            formData.append("book", new Blob([JSON.stringify(userBook)], {
                type: "application/json"
            }));
            const resp = await this.client.put<UserBook>(`/userbooks/${userBook.id}`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    Accept: "application/json"
                },
                onUploadProgress
            });
            return resp.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                throw new Error("error updating book " + error.response.status + " " + error);
            }
            throw new Error("error updating book " + error);
        }
    };

    updateUserBook = async (userBook: UserBookUpdate): Promise<UserBook> => {
        try {
            const resp = await this.client.put<UserBook>(`/userbooks/${userBook.id}`, userBook);
            return resp.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                throw new Error("error updating book " + error.response.status + " " + error);
            }
            throw new Error("error updating book " + error);
        }
    };

    findUserBookByCriteria = async (
        lastEventTypes?: Array<ReadingEventType> | null, bookId?: string | null,
        userId?: string | null, toRead?: boolean | null, owned?: boolean | null,
        borrowed?: boolean | null, page?: number, size?: number, sort?: string,
        signal?: AbortSignal
    ): Promise<Page<UserBook>> => {
        try {
            const response = await this.client.get<Page<UserBook>>("/userbooks", {
                params: { lastEventTypes, bookId, userId, toRead, owned, borrowed, page, size, sort },
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
            throw new Error("error get userBook by eventType " + error);
        }
    };

    deleteUserBook = async (userbookId: string): Promise<void> => {
        try {
            const response = await this.client.delete(`/userbooks/${userbookId}`);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                // intentionally empty catch
            }
            throw new Error("error delete userbook " + error);
        }
    };

    bulkEditUserBooks = async (bulkUpdateDto: UserBookBulkUpdate): Promise<number> => {
        try {
            const resp = await this.client.put<number>("/userbooks", {
                ids: bulkUpdateDto.ids,
                addTags: bulkUpdateDto.addTags,
                removeTags: bulkUpdateDto.removeTags,
                owned: bulkUpdateDto.owned,
                toRead: bulkUpdateDto.toRead,
            });
            return resp.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                throw new Error("error bulk updating " + error.response.status + " " + error);
            }
            throw new Error("error bulk updating " + error);
        }
    };
}

export const userBookService = new UserBookService();