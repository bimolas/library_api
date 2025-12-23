import { BorrowingService } from "./borrowing.service";
import { CreateBorrowDto } from "./dto/create-borrow.dto";
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
    getUserBorrows(user: any): Promise<{
        id: any;
        status: any;
        borrowDate: any;
        dueDate: any;
        returnDate: any;
        book: {
            id: any;
            title: any;
        };
        copy: {
            id: any;
            status: any;
        };
    }[]>;
    getOverdueBooks(user: any): Promise<{
        id: any;
        book: any;
        dueDate: any;
        daysOverdue: number;
    }[]>;
}
