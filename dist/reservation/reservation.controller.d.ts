import { ReservationService } from "./reservation.service";
import type { CreateReservationDto } from "./dto/create-reservation.dto";
export declare class ReservationController {
    private reservationService;
    constructor(reservationService: ReservationService);
    createReservation(user: any, createReservationDto: CreateReservationDto): Promise<{
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
    getEarliestAvailableSlot(bookId: string): Promise<{
        availableFrom: any;
        message: string;
    }>;
    getUserReservations(user: any): Promise<any>;
}
