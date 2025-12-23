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
    }>;
    getTrendingBooks(): Promise<any[]>;
    getMostReservedBooks(): Promise<any[]>;
    getDemandVsSupply(): Promise<any[]>;
    getGenreDistribution(userId: string): Promise<{
        genre: any;
        count: any;
    }[]>;
    getLateReturnStatistics(): Promise<any>;
}
