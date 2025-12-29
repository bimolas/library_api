import { ReservationService } from "./reservation.service";
import { CreateReservationDto } from "./dto/create-reservation.dto";
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
    getReservationQueue(bookId: string): Promise<{
        position: any;
        reservationId: any;
        userId: any;
        userName: any;
        priority: any;
        startDate: any;
        endDate: any;
    }[]>;
    getEarliestAvailableSlot(bookId: string): Promise<{
        availableFrom: any;
        message: string;
    }>;
    getUserReservations(user: any): Promise<{
        id: any;
        book: {
            id: any;
            title: any;
            author: any;
            isbn: any;
            description: any;
            publicationYear: any;
            genre: any;
        };
        startDate: any;
        endDate: any;
        priority: any;
        status: any;
        durationDays: number;
    }[]>;
}
