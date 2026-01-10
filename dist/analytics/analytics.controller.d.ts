import { AnalyticsService } from "./analytics.service";
export declare class AnalyticsController {
    private analyticsService;
    constructor(analyticsService: AnalyticsService);
    getUserAnalytics(user: any): Promise<{
        borrowCount: any;
        reservationCount: any;
        reviewCount: any;
        genresRead: any;
        totalScoreEvents: any;
        currentScore: any;
        tier: any;
        createdAt: any;
        progress: any;
        name: any;
        email: any;
        status: any;
        imageUrl: any;
    }>;
    getPlatformSummary(): Promise<{
        totalActiveBorrows: any;
        totalActiveReservations: any;
        totalUsers: any;
        avgBorrowDays: number;
    }>;
    getBookAvailability(id: string): Promise<{
        id: any;
        title: any;
        author: any;
        description: any;
        publicationYear: any;
        totalCopies: any;
        availableCopies: any;
        borrows: {
            id: any;
            userId: any;
            userName: any;
            borrowDate: any;
            dueDate: any;
            status: any;
        }[];
        reservations: {
            id: any;
            userId: any;
            userName: any;
            reservedAt: any;
            endDate: any;
            status: any;
        }[];
    } | null>;
    getTrendingBooks(): Promise<{
        id: any;
        title: any;
        author: any;
        borrowCount: any;
        avgRating: any;
        reviewCount: any;
        genre: any;
    }[]>;
    getMostReservedBooks(): Promise<any[]>;
    getDemandVsSupply(): Promise<any[]>;
    getGenreDistribution(userId: string): Promise<{
        genre: any;
        count: any;
        score: any;
    }[]>;
    getGenreDistributionAll(): Promise<{
        genre: any;
        count: any;
        avgRating: number | null;
    }[]>;
    getLateReturnStatistics(): Promise<any>;
    getRecommendations(user: any, limit?: number): Promise<{
        id: any;
        title: any;
        author: any;
        description: any;
        publicationYear: any;
        coverImage: any;
        genres: any;
        genre: any;
        popularity: any;
        totalCopies: any;
        availableCopies: any;
        rating: any;
        demandPressure: any;
    }[]>;
    getUserAnaliticById(id: string): Promise<{
        borrowCount: any;
        reservationCount: any;
        reviewCount: any;
        genresRead: any;
        totalScoreEvents: any;
        currentScore: any;
        tier: any;
        createdAt: any;
        progress: any;
        name: any;
        email: any;
        status: any;
        imageUrl: any;
    }>;
}
