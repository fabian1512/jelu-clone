import axios from "axios";
import dayjs from "dayjs";
import { Page } from "../model/Page";
import { CreateReviewDto, Review, UpdateReviewDto, Visibility } from "../model/Review";
import { createApiClient } from "./apiClientFactory";

class ReviewService {
    private client = createApiClient();

    saveReview = async (review: CreateReviewDto): Promise<Review> => {
        try {
            const resp = await this.client.post<Review>("/reviews", review);
            return resp.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                throw new Error("error creating review " + error.response.status + " " + error);
            }
            throw new Error("error creating review " + error);
        }
    };

    private transformReviews = (data: string) => {
        const page = JSON.parse(data);
        if (page.content) {
            for (const ev of page.content) {
                if (ev.modificationDate != null) {
                    ev.modificationDate = dayjs(ev.modificationDate).toDate();
                }
                if (ev.creationDate != null) {
                    ev.creationDate = dayjs(ev.creationDate).toDate();
                }
                if (ev.reviewDate != null) {
                    ev.reviewDate = dayjs(ev.reviewDate).toDate();
                }
            }
        }
        return page;
    };

    private transformReview = (data: string) => {
        const ev = JSON.parse(data);
        if (ev.modificationDate != null) {
            ev.modificationDate = dayjs(ev.modificationDate).toDate();
        }
        if (ev.creationDate != null) {
            ev.creationDate = dayjs(ev.creationDate).toDate();
        }
        if (ev.reviewDate != null) {
            ev.reviewDate = dayjs(ev.reviewDate).toDate();
        }
        return ev;
    };

    findReviews = async (
        userId?: string, bookId?: string, visibility: Visibility | null = null,
        after?: string | null, before?: string | null,
        page?: number, size?: number, sort?: string | null,
        signal?: AbortSignal
    ): Promise<Page<Review>> => {
        try {
            const response = await this.client.get<Page<Review>>("/reviews", {
                params: { userId, bookId, visibility, after, before, page, size, sort },
                transformResponse: this.transformReviews,
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
            throw new Error("error finding reviews " + error);
        }
    };

    findReviewById = async (reviewId: string): Promise<Review> => {
        try {
            const response = await this.client.get<Review>(`/reviews/${reviewId}`, {
                transformResponse: this.transformReview
            });
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                // intentionally empty catch
            }
            throw new Error("error finding review by id " + error);
        }
    };

    deleteReview = async (reviewId: string): Promise<void> => {
        try {
            const response = await this.client.delete(`/reviews/${reviewId}`);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                throw new Error("error deleting review " + error.response.status + " " + error);
            }
            throw new Error("error deleting review " + error);
        }
    };

    updateReview = async (reviewId: string, updateDto: UpdateReviewDto): Promise<Review> => {
        try {
            const response = await this.client.put<Review>(`/reviews/${reviewId}`, updateDto);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                throw new Error("error updating review " + error.response.status + " " + error);
            }
            throw new Error("error updating review " + error);
        }
    };
}

export const reviewService = new ReviewService();