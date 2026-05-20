import axios from "axios";
import dayjs from "dayjs";
import qs from "qs";
import { Page } from "../model/Page";
import { MessageCategory, UpdateUserMessage, UserMessage } from "../model/UserMessage";
import { createApiClient } from "./apiClientFactory";

class MessageService {
    private client = createApiClient();

    private transformUserMessage = (data: string) => {
        const ev = JSON.parse(data);
        if (ev.modificationDate != null) {
            ev.modificationDate = dayjs(ev.modificationDate).toDate();
        }
        return ev;
    };

    messages = async (
        messageCategories?: Array<MessageCategory> | null, read?: boolean,
        page?: number, size?: number, sort?: string,
        signal?: AbortSignal
    ): Promise<Page<UserMessage>> => {
        try {
            const response = await this.client.get<Page<UserMessage>>("/user-messages", {
                params: { messageCategories: messageCategories, read, page, size, sort },
                paramsSerializer: {
                    serialize: (params) => qs.stringify(params, { arrayFormat: "comma" })
                },
                transformResponse: this.transformUserMessage,
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
            throw new Error("error messages " + error);
        }
    };

    updateUserMessage = async (messageId: string, updateDto: UpdateUserMessage): Promise<UserMessage> => {
        try {
            const response = await this.client.put<UserMessage>(`/user-messages/${messageId}`, updateDto);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                throw new Error("error updating user message " + error.response.status + " " + error);
            }
            throw new Error("error updating user message " + error);
        }
    };
}

export const messageService = new MessageService();