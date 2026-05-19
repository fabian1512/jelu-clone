import axios from "axios";
import { ImportConfigurationDto } from "../model/ImportConfiguration";
import { Metadata } from "../model/Metadata";
import { DirectoryListing } from "../model/DirectoryListing";
import { createApiClient } from "./apiClientFactory";

class ImportExportService {
    private client = createApiClient();

    importCsv = async (
        importConfig: ImportConfigurationDto,
        file: File,
        onUploadProgress: any
    ): Promise<void> => {
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("config", JSON.stringify(importConfig));
            await this.client.post("/imports", formData, {
                headers: { "Content-Type": "multipart/form-data" },
                onUploadProgress
            });
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                throw new Error("error import csv " + error.response.status + " " + error);
            }
            throw new Error("error import csv " + error);
        }
    };

    exportCsv = async (): Promise<void> => {
        try {
            const response = await this.client.get("/exports", {
                responseType: "blob"
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "jelu-export.csv");
            document.body.appendChild(link);
            link.click();
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                throw new Error("error export csv " + error.response.status + " " + error);
            }
            throw new Error("error export csv " + error);
        }
    };

    getDirectoryListing = async (path: string, reason = "metadata"): Promise<DirectoryListing> => {
        try {
            const response = await this.client.post<DirectoryListing>("/filesystem", {
                reason,
                path
            });
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                // intentionally empty catch
            }
            throw new Error("error directory listing " + error);
        }
    };

    getMetadataFromUploadedFile = async (
        file: File | null,
        onUploadProgress: any
    ): Promise<Metadata> => {
        try {
            const formData = new FormData();
            if (file != null) {
                formData.append("file", file);
            }
            const response = await this.client.post<Metadata>("/metadata/file", formData, {
                headers: { "Content-Type": "multipart/form-data" },
                onUploadProgress
            });
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                throw new Error("error metadata from file " + error.response.status + " " + error);
            }
            throw new Error("error metadata from file " + error);
        }
    };

    getMetadataFromFile = async (filePath: string): Promise<Metadata> => {
        try {
            const response = await this.client.get<Metadata>("/metadata/file", {
                params: { filePath }
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

export const importExportService = new ImportExportService();