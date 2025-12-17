import { Neo4jService } from "../neo4j/neo4j.service";
export declare class AnalyticsService {
    private neo4j;
    constructor(neo4j: Neo4jService);
    getUserAnalytics(userId: string): Promise<any>;
    getTrendingBooks(limit?: number): Promise<any>;
    getMostReservedBooks(limit?: number): Promise<any>;
    getDemandVsSupply(): Promise<any>;
    getGenreDistribution(userId: string): Promise<any>;
    getLateReturnStatistics(): Promise<any>;
}
