import { AnalyticsService } from "./analytics.service";
export declare class AnalyticsController {
    private analyticsService;
    constructor(analyticsService: AnalyticsService);
    getUserAnalytics(user: any): Promise<any>;
    getTrendingBooks(): Promise<any>;
    getMostReservedBooks(): Promise<any>;
    getDemandVsSupply(): Promise<any>;
    getGenreDistribution(userId: string): Promise<any>;
    getLateReturnStatistics(): Promise<any>;
}
