import axios, { AxiosInstance, AxiosHeaders } from "axios";
import router from "../router";
import urls from "../urls";

const TOKEN_KEY = "jelu-token";

function getToken(): string | null {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored != null && stored.trim().length > 0) {
        return stored;
    }
    return null;
}

function createApiClient(tokenProvider: () => string | null = getToken): AxiosInstance {
    const client = axios.create({
        baseURL: urls.API_URL,
        headers: {
            "Content-type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
        },
        withCredentials: true,
    });

    client.interceptors.request.use(
        (config) => {
            const tok = tokenProvider();
            if (tok != null) {
                if (!config.headers) {
                    config.headers = new AxiosHeaders();
                }
                config.headers["X-Auth-Token"] = tok;
            }
            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    );

    client.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error != null && error.response != null && error.response.status === 401) {
                router.push({ name: "login" });
            }
            return Promise.reject(error);
        }
    );

    return client;
}

export { createApiClient, getToken, TOKEN_KEY };