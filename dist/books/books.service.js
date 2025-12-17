"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BooksService = void 0;
const common_1 = require("@nestjs/common");
const neo4j_service_1 = require("../neo4j/neo4j.service");
const crypto_1 = require("crypto");
let BooksService = class BooksService {
    constructor(neo4j) {
        this.neo4j = neo4j;
    }
    async createBook(createBookDto) {
        const bookId = (0, crypto_1.randomUUID)();
        const query = `
      MATCH (g:Genre { name: $genreName })
      CREATE (b:Book {
        id: $bookId,
        title: $title,
        author: $author,
        isbn: $isbn,
        description: $description,
        publicationYear: $publicationYear,
        createdAt: datetime()
      })
      CREATE (b)-[:BELONGS_TO]->(g)
      RETURN b
    `;
        const result = await this.neo4j.write(query, {
            bookId,
            title: createBookDto.title,
            author: createBookDto.author,
            isbn: createBookDto.isbn,
            description: createBookDto.description,
            publicationYear: createBookDto.publicationYear,
            genreName: createBookDto.genre,
        });
        return this.mapNeo4jToBook(result.records[0].get("b"));
    }
    async addBookCopy(bookId, quantity = 1) {
        const copyIds = Array.from({ length: quantity }, () => (0, crypto_1.randomUUID)());
        for (const copyId of copyIds) {
            const query = `
        MATCH (b:Book { id: $bookId })
        CREATE (bc:BookCopy {
          id: $copyId,
          status: 'AVAILABLE',
          createdAt: datetime()
        })
        CREATE (b)-[:HAS_COPY]->(bc)
        RETURN bc
      `;
            await this.neo4j.write(query, { bookId, copyId });
        }
        return { bookId, copiesTotalAdded: quantity };
    }
    async getBook(bookId) {
        const query = `
      MATCH (b:Book { id: $bookId })
      OPTIONAL MATCH (b)-[:BELONGS_TO]->(g:Genre)
      OPTIONAL MATCH (b)-[:HAS_COPY]->(bc:BookCopy)
      RETURN b, g, COLLECT(bc) as copies
    `;
        const result = await this.neo4j.read(query, { bookId });
        if (result.records.length === 0) {
            throw new common_1.NotFoundException("Book not found");
        }
        const record = result.records[0];
        const book = this.mapNeo4jToBook(record.get("b"));
        const genre = record.get("g");
        const copies = record.get("copies");
        return {
            ...book,
            genre: genre ? genre.properties.name : null,
            totalCopies: copies.length,
            availableCopies: copies.filter((c) => c.properties.status === "AVAILABLE").length,
            copies: copies.map((c) => ({
                id: c.properties.id,
                status: c.properties.status,
            })),
        };
    }
    async searchBooks(query, limit = 20, skip = 0) {
        const searchQuery = `
      MATCH (b:Book)
      WHERE 
        b.title CONTAINS $query OR 
        b.author CONTAINS $query OR 
        b.isbn CONTAINS $query
      RETURN b
      SKIP $skip
      LIMIT $limit
    `;
        const result = await this.neo4j.read(searchQuery, { query, skip, limit });
        return result.records.map((r) => this.mapNeo4jToBook(r.get("b")));
    }
    async getAvailableCopies(bookId) {
        const query = `
      MATCH (b:Book { id: $bookId })-[:HAS_COPY]->(bc:BookCopy { status: 'AVAILABLE' })
      RETURN COLLECT(bc.id) as copyIds
    `;
        const result = await this.neo4j.read(query, { bookId });
        return result.records[0].get("copyIds");
    }
    async getBookCopyStatus(copyId) {
        const query = `
      MATCH (bc:BookCopy { id: $copyId })
      RETURN bc
    `;
        const result = await this.neo4j.read(query, { copyId });
        if (result.records.length === 0) {
            throw new common_1.NotFoundException("Book copy not found");
        }
        return result.records[0].get("bc").properties;
    }
    mapNeo4jToBook(node) {
        return {
            id: node.properties.id,
            title: node.properties.title,
            author: node.properties.author,
            isbn: node.properties.isbn,
            description: node.properties.description,
            publicationYear: node.properties.publicationYear,
            createdAt: node.properties.createdAt,
        };
    }
};
exports.BooksService = BooksService;
exports.BooksService = BooksService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [neo4j_service_1.Neo4jService])
], BooksService);
