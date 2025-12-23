import { BooksService } from "./books.service";
import { CreateBookDto } from "./dto/create-book.dto";
declare class AddCopiesDto {
    quantity: number;
}
export declare class BooksController {
    private booksService;
    constructor(booksService: BooksService);
    createBook(createBookDto: CreateBookDto): Promise<{
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
    searchBooks(query: string, limit?: number, skip?: number): Promise<{
        id: any;
        title: any;
        author: any;
        isbn: any;
        description: any;
        publicationYear: any;
        createdAt: any;
    }[]>;
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
