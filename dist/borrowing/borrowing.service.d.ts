import { Neo4jService } from "../neo4j/neo4j.service";
import { ScoreService } from "../score/score.service";
import { BooksService } from "../books/books.service";
import type { CreateBorrowDto } from "./dto/create-borrow.dto";
export declare class BorrowingService {
    private neo4j;
    private scoreService;
    private booksService;
    constructor(neo4j: Neo4jService, scoreService: ScoreService, booksService: BooksService);
    borrowBook(userId: string, createBorrowDto: CreateBorrowDto): Promise<{
        id: string;
        status: string;
        borrowDate: string;
        dueDate: string;
        copyId: any;
    }>;
    returnBook(borrowId: string, userId: string): Promise<{
        id: string;
        status: string;
        returnDate: any;
        isOnTime: boolean;
    }>;
    getUserBorrows(userId: string, status?: string): Promise<{
        id: any;
        status: any;
        borrowDate: any;
        dueDate: any;
        returnDate: any;
        book: {
            id: any;
            title: any;
            author: any;
        };
        copy: {
            id: any;
            status: any;
        };
    }[]>;
    getActiveBorrowCount(userId: string): Promise<number>;
    getLatestBorrowsByNearbyScores(userId: string, tolerance?: number, limit?: number): Promise<{
        user: {
            id: any;
            name: any;
            email: any;
            score: any;
            tier: any;
        };
        borrow: {
            id: any;
            borrowDate: any;
            dueDate: any;
            returnDate: any;
            status: any;
        };
        book: {
            id: any;
            title: any;
            author: any;
            rating: number | null;
            reviewCount: any;
        };
    }[]>;
    getMonthlyBorrowStatsLastMonths(months?: number): Promise<{
        month: any;
        year: any;
        borrows: any;
        returns: any;
        late: any;
    }[]>;
    getOverdueBooks(userId: string): Promise<{
        id: any;
        book: any;
        dueDate: any;
        daysOverdue: number;
    }[]>;
}
