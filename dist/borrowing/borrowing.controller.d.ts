import { BorrowingService } from "./borrowing.service";
import type { CreateBorrowDto } from "./dto/create-borrow.dto";
export declare class BorrowingController {
    private borrowingService;
    constructor(borrowingService: BorrowingService);
    borrowBook(createBorrowDto: CreateBorrowDto, user: any): Promise<{
        id: string;
        status: string;
        borrowDate: string;
        dueDate: string;
        copyId: any;
    }>;
    returnBook(borrowId: string, user: any): Promise<{
        id: string;
        status: string;
        returnDate: any;
        isOnTime: boolean;
    }>;
    getUserBorrows(user: any): Promise<any>;
    getOverdueBooks(user: any): Promise<any>;
}
