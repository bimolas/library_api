import { Neo4jService } from "../neo4j/neo4j.service";
export declare enum ScoreEventType {
    ON_TIME_RETURN = "ON_TIME_RETURN",
    LATE_RETURN = "LATE_RETURN",
    CANCELLATION = "CANCELLATION",
    GENRE_DIVERSITY = "GENRE_DIVERSITY",
    ACTIVITY_FREQUENCY = "ACTIVITY_FREQUENCY"
}
export declare class ScoreService {
    private neo4j;
    private readonly scoreWeights;
    constructor(neo4j: Neo4jService);
    recordScoreEvent(userId: string, eventType: ScoreEventType, amount?: number): Promise<void>;
    getUserScore(userId: string): Promise<{
        currentScore: any;
        tier: any;
        events: any;
    }>;
    getPrivileges(userId: string): Promise<{
        maxConcurrentBorrows: number;
        borrowDuration: number;
        canReserve: boolean;
        canOverrideReservation: boolean;
        earlyAccessToReturns: boolean;
        visibilityLevel: string;
    }>;
    private calculateMaxBorrows;
    private calculateBorrowDuration;
    private calculateVisibility;
}
