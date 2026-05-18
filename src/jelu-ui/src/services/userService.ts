import axios from "axios";
import { CreateUser, LoginHistoryInfo, UpdateUser, User, UserAuthentication } from "../model/User";
import { createApiClient } from "./apiClientFactory";

class UserService {
    private client = createApiClient();
    private token: string | null = null;
    private TOKEN_KEY = "auth_token_jelu";

    getUser = async (): Promise<UserAuthentication> => {
        try {
            const response = await this.client.get<UserAuthentication>("/users/me");
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                // intentionally empty catch
            }
            throw new Error("error user " + error);
        }
    };

    getUsers = async (): Promise<Array<User>> => {
        try {
            const response = await this.client.get<Array<User>>("/users");
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                // intentionally empty catch
            }
            throw new Error("error users " + error);
        }
    };

    getUserById = async (userId: string): Promise<User> => {
        try {
            const response = await this.client.get<User>(`/users/${userId}`);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                // intentionally empty catch
            }
            throw new Error("error get user by id " + error);
        }
    };

    authenticateUser = async (login: string, password: string): Promise<User> => {
        try {
            const response = await this.client.get<UserAuthentication>("/users/me", {
                auth: { username: login, password }
            });
            if (response.data.token != null && response.data.token.length > 0) {
                this.token = response.data.token;
                localStorage.setItem(this.TOKEN_KEY, this.token);
            }
            return response.data.user;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                throw new Error("login error " + error.response.status + " " + error);
            }
            throw new Error("login error, backend seems down or unreachable");
        }
    };

    fetchToken = async (login?: string, password?: string): Promise<string> => {
        try {
            let response;
            if (login != null && password != null
                && login.trim().length > 0 && password.trim().length > 0) {
                response = await this.client.get("/token", {
                    auth: { username: login, password }
                });
            } else {
                response = await this.client.get("/token");
            }
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                // intentionally empty catch
            }
            throw new Error("error auth token " + error);
        }
    };

    deleteUser = async (userId: string): Promise<void> => {
        try {
            const response = await this.client.delete(`/users/${userId}`);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                // intentionally empty catch
            }
            throw new Error("error delete user " + error);
        }
    };

    createUser = async (user: CreateUser): Promise<User> => {
        try {
            const resp = await this.client.post<User>("/users", user);
            return resp.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                throw new Error("Error ! " + error.response.data.message);
            }
            throw new Error("error create user " + error);
        }
    };

    updateUser = async (userId: string, user: UpdateUser): Promise<User> => {
        try {
            const resp = await this.client.put<User>(`/users/${userId}`, user);
            return resp.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                throw new Error("Error ! " + error.response.data.message);
            }
            throw new Error("error update user " + error);
        }
    };

    createInitialUser = async (login: string, password: string): Promise<User> => {
        try {
            const resp = await this.client.post<User>("/users", {
                login,
                password,
                isAdmin: true
            }, {
                auth: { username: "setup", password: "initial" }
            });
            return resp.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                throw new Error("error create user " + error.response.status + " " + error);
            }
            throw new Error("error create user " + error);
        }
    };

    setupStatus = async (): Promise<boolean> => {
        try {
            const response = await this.client.get("/setup/status");
            return response.data.isInitialSetup;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                // intentionally empty catch
            }
            throw new Error("error setup " + error);
        }
    };

    logout = async (): Promise<void> => {
        try {
            await this.client.post("/logout", {}, { withCredentials: true });
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                // intentionally empty catch
            }
        } finally {
            localStorage.removeItem(this.TOKEN_KEY);
        }
    };

    usernameById = async (userId: string): Promise<string> => {
        try {
            const response = await this.client.get(`/username/${userId}`);
            return response.data.username;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                // intentionally empty catch
            }
            throw new Error("error username by id " + error);
        }
    };

    userLoginHistory = async (): Promise<Array<LoginHistoryInfo>> => {
        try {
            const response = await this.client.get<Array<LoginHistoryInfo>>("/users/history");
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                // intentionally empty catch
            }
            throw new Error("error user login history " + error);
        }
    };
}

export const userService = new UserService();