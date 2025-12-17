import { Neo4jService } from "../neo4j/neo4j.service";
import { ScoreService } from "../score/score.service";
import type { CreateReservationDto } from "./dto/create-reservation.dto";
export declare class ReservationService {
    private neo4j;
    private scoreService;
    constructor(neo4j: Neo4jService, scoreService: ScoreService);
    createReservation(userId: string, createReservationDto: CreateReservationDto): Promise<{
        id: `${string}-${string}-${string}-${string}-${string}`;
        startDate: string;
        endDate: string;
        priority: number;
        status: string;
    }>;
    cancelReservation(reservationId: string): Promise<{
        id: string;
        status: string;
    }>;
    getReservationQueue(bookId: string): Promise<any>;
    getUserReservations(userId: string): Promise<any>;
    getEarliestAvailableSlot(bookId: string): Promise<{
        availableFrom: any;
        message: string;
    }>;
    private calculatePriority;
}
