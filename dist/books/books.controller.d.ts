import { BooksService } from "./books.service";
import { CreateBookDto } from "./dto/create-book.dto";
import { CreateCommentDto } from "./dto/Create-Comment.Dto";
declare class AddCopiesDto {
    quantity: number;
}
export declare class BooksController {
    private booksService;
    constructor(booksService: BooksService);
    createBook(createBookDto: CreateBookDto, file: any): Promise<{
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
    updateBook(bookId: string, updateBookDto: CreateBookDto, file?: any): Promise<{
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
    addCopies(bookId: string, body: AddCopiesDto): Promise<{
        bookId: string;
        copiesTotalAdded: number;
    }>;
    deleteBook(bookId: string): Promise<{
        message: string;
    }>;
    deleteBookCopies(bookId: string, quantity: number): Promise<{
        bookId: string;
        deleted: any;
    }>;
    searchBooks(query: string, limit?: number, skip?: number): Promise<{
        items: {
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
        }[];
        total: number;
        limit: number;
        skip: number;
        totalPages: number;
        currentPage: number;
    }>;
    searchBookss(): Promise<{
        createdBooks: void[];
    }>;
    getBook(id: string): Promise<{
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
    addComment(bookId: string, user: any, body: CreateCommentDto): Promise<{
        id: any;
        message: any;
        rating: any;
        reviewerName: any;
        createdAt: any;
    }>;
    getComments(bookId: string): Promise<{
        id: any;
        message: any;
        rating: any;
        reviewerName: any;
        reviewerId: any;
        createdAt: any;
    }[]>;
}
export {};
