import { Neo4jService } from "../neo4j/neo4j.service";
import type { CreateBookDto } from "./dto/create-book.dto";
export declare class BooksService {
    private neo4j;
    constructor(neo4j: Neo4jService);
    deleteBook(bookId: string): Promise<{
        message: string;
    }>;
    getComments(bookId: string): Promise<{
        id: any;
        message: any;
        rating: any;
        reviewerName: any;
        reviewerId: any;
        createdAt: any;
    }[]>;
    createComment(bookId: string, userId: string, message: string, rating: number): Promise<{
        id: any;
        message: any;
        rating: any;
        reviewerName: any;
        createdAt: any;
    }>;
    createBook(createBookDto: CreateBookDto): Promise<{
        id: any;
        title: any;
        author: any;
        isbn: any;
        description: any;
        publicationYear: any;
        genre: any;
        publisher: any;
        pages: any;
        language: any;
        coverImage: any;
        createdAt: Date | null;
        totalCopies: any;
        availableCopies: any;
        copies: any;
        rating: number;
        borrowCount: any;
        reviewCount: any;
    }>;
    updateBook(bookId: string, updateBookDto: CreateBookDto): Promise<{
        id: any;
        title: any;
        author: any;
        isbn: any;
        description: any;
        publicationYear: any;
        genre: any;
        publisher: any;
        pages: any;
        language: any;
        coverImage: any;
        createdAt: Date | null;
        totalCopies: any;
        availableCopies: any;
        copies: any;
        rating: number;
        borrowCount: any;
        reviewCount: any;
    }>;
    addBookCopy(bookId: string, quantity?: number): Promise<{
        bookId: string;
        copiesTotalAdded: number;
    }>;
    removeBookCopies(bookId: string, quantity?: number): Promise<{
        bookId: string;
        deleted: any;
    }>;
    getBook(bookId: string): Promise<{
        genre: any;
        totalCopies: any;
        availableCopies: any;
        copies: any;
        id: any;
        title: any;
        author: any;
        isbn: any;
        description: any;
        publicationYear: any;
        publisher: any;
        pages: any;
        language: any;
        coverImage: any;
        createdAt: Date | null;
        rating: number;
        borrowCount: any;
        reviewCount: any;
    }>;
    searchBooks(query: string, limit?: number, skip?: number): Promise<{
        borrowedCopies: any;
        activeReservations: any;
        demandPressure: any;
        highDemand: boolean;
        id: any;
        title: any;
        author: any;
        isbn: any;
        description: any;
        publicationYear: any;
        genre: any;
        publisher: any;
        pages: any;
        language: any;
        coverImage: any;
        createdAt: Date | null;
        totalCopies: any;
        availableCopies: any;
        copies: any;
        rating: number;
        borrowCount: any;
        reviewCount: any;
    }[]>;
    getAvailableCopies(bookId: string): Promise<any>;
    getBookCopyStatus(copyId: string): Promise<any>;
    private mapNeo4jToBook;
}
