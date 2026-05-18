import axios from "axios";
import { MonthStats, TotalsStats, YearStats } from "../model/YearStats";
import { createApiClient } from "./apiClientFactory";

class StatsService {
    private client = createApiClient();

    yearStats = async (): Promise<YearStats[]> => {
        try {
            const response = await this.client.get<YearStats[]>("/stats");
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                // intentionally empty catch
            }
            throw new Error("error year stats " + error);
        }
    };

    monthStatsForYear = async (year: number): Promise<MonthStats[]> => {
        try {
            const response = await this.client.get<MonthStats[]>(`/stats/${year}`);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                // intentionally empty catch
            }
            throw new Error("error month stats " + error);
        }
    };

    yearsWithStats = async (): Promise<number[]> => {
        try {
            const response = await this.client.get<number[]>("/stats/years");
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                // intentionally empty catch
            }
            throw new Error("error years with stats " + error);
        }
    };

    totalsStats = async (): Promise<TotalsStats> => {
        try {
            const response = await this.client.get<TotalsStats>("/stats/total");
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                // intentionally empty catch
            }
            throw new Error("error totals stats " + error);
        }
    };
}

export const statsService = new StatsService();