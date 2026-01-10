import { Neo4jService } from "../neo4j/neo4j.service";
export declare class AnalyticsService {
    private neo4j;
    constructor(neo4j: Neo4jService);
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
    getUserAnalytics(userId: string): Promise<{
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
    getTrendingBooks(limit?: number): Promise<{
        id: any;
        title: any;
        author: any;
        borrowCount: any;
        avgRating: any;
        reviewCount: any;
        genre: any;
    }[]>;
    getMostReservedBooks(limit?: number): Promise<any[]>;
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
    getRecommendations(userId: string, limit?: number): Promise<{
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
    getLateReturnStatistics(): Promise<any>;
}
