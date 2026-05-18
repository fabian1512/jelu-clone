import axios from "axios";
import { Metadata } from "../model/Metadata";
import { MetadataRequest } from "../model/MetadataRequest";
import { createApiClient } from "./apiClientFactory";

class MetadataService {
    private client = createApiClient();

    fetchMetadata = async (isbn?: string, title?: string, authors?: string): Promise<Metadata> => {
        try {
            const response = await this.client.get<Metadata>("/metadata", {
                params: { isbn, title, authors }
            });
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                // intentionally empty catch
            }
            throw new Error("error metadata " + error);
        }
    };

    fetchMetadataWithPlugins = async (metadataRequest: MetadataRequest): Promise<Metadata> => {
        try {
            const response = await this.client.post<Metadata>("/metadata", metadataRequest);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                // intentionally empty catch
            }
            throw new Error("error metadata " + error);
        }
    };

    searchMetadataWithPlugins = async (metadataRequest: MetadataRequest): Promise<Metadata[]> => {
        try {
            const response = await this.client.post<Metadata[]>("/metadata/search", metadataRequest);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                // intentionally empty catch
            }
            throw new Error("error search metadata " + error);
        }
    };

    getMetadataFromUploadedFile = async (file: File | null, onUploadProgress?: (progressEvent: any) => void): Promise<Metadata> => {
        try {
            const formData = new FormData();
            if (file != null) {
                formData.append("file", file);
            }
            const resp = await this.client.post<Metadata>("/metadata/file", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    Accept: "application/json"
                },
                onUploadProgress
            });
            return resp.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                throw new Error("error uploading file " + error.response.status + " " + error);
            }
            throw new Error("error uploading file " + error);
        }
    };

    getMetadataFromFile = async (filePath: string): Promise<Metadata> => {
        try {
            const response = await this.client.get<Metadata>("/metadata/file", {
                params: { filepath: filePath }
            });
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                // intentionally empty catch
            }
            throw new Error("error metadata from path " + error);
        }
    };
}

export const metadataService = new MetadataService();