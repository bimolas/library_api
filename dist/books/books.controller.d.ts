import { BooksService } from "./books.service";
interface AddCopiesDto {
    quantity: number;
}
export declare class BooksController {
    private booksService;
    constructor(booksService: BooksService);
    createBook(createBookDto: any): Promise<{
        id: any;
        title: any;
        author: any;
        isbn: any;
        description: any;
        publicationYear: any;
        createdAt: any;
    }>;
    addCopies(bookId: string, body: AddCopiesDto): Promise<{
        bookId: string;
        copiesTotalAdded: number;
    }>;
    searchBooks(query: string, limit?: number, skip?: number): Promise<any>;
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
        createdAt: any;
    }>;
}
export {};
