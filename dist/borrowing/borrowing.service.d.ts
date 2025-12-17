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
    getUserBorrows(userId: string, status?: string): Promise<any>;
    getActiveBorrowCount(userId: string): Promise<number>;
    getOverdueBooks(userId: string): Promise<any>;
}
