import { Neo4jService } from "../neo4j/neo4j.service";
import type { CreateBookDto } from "./dto/create-book.dto";
export declare class BooksService {
    private neo4j;
    constructor(neo4j: Neo4jService);
    createBook(createBookDto: CreateBookDto): Promise<{
        id: any;
        title: any;
        author: any;
        isbn: any;
        description: any;
        publicationYear: any;
        createdAt: any;
    }>;
    addBookCopy(bookId: string, quantity?: number): Promise<{
        bookId: string;
        copiesTotalAdded: number;
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
        createdAt: any;
    }>;
    searchBooks(query: string, limit?: number, skip?: number): Promise<{
        id: any;
        title: any;
        author: any;
        isbn: any;
        description: any;
        publicationYear: any;
        createdAt: any;
    }[]>;
    getAvailableCopies(bookId: string): Promise<any>;
    getBookCopyStatus(copyId: string): Promise<any>;
    private mapNeo4jToBook;
}
