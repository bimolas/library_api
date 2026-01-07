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
    async deleteBook(bookId) {
        const query = `
      MATCH (b:Book { id: $bookId })
      DETACH DELETE b
      RETURN COUNT(b) AS deletedCount
    `;
        const result = await this.neo4j.write(query, { bookId });
        const deletedCount = result.records[0].get("deletedCount").toNumber();
        if (deletedCount === 0) {
            throw new common_1.NotFoundException("Book not found");
        }
        return { message: "Book deleted successfully" };
    }
    async getComments(bookId) {
        const query = `
      MATCH (b:Book { id: $bookId })<-[:ON]-(rev:Review)<-[:REVIEWED]-(u:User)
      RETURN rev, u.name AS reviewerName, u.id AS reviewerId
      ORDER BY rev.createdAt DESC
    `;
        const result = await this.neo4j.read(query, { bookId });
        if (!result.records || result.records.length === 0)
            return [];
        return result.records.map((rec) => {
            const node = rec.get("rev");
            const reviewerName = rec.get("reviewerName");
            const reviewerId = rec.get("reviewerId");
            return {
                id: node.properties.id,
                message: node.properties.message,
                rating: node.properties.rating,
                reviewerName,
                reviewerId,
                createdAt: node.properties.createdAt &&
                    typeof node.properties.createdAt.toString === "function"
                    ? node.properties.createdAt.toString()
                    : node.properties.createdAt,
            };
        });
    }
    async createComment(bookId, userId, message, rating) {
        const revId = (0, crypto_1.randomUUID)();
        const query = `
      MATCH (u:User { id: $userId }), (b:Book { id: $bookId })
      CREATE (rev:Review {
        id: $revId,
        message: $message,
        rating: $rating,
        createdAt: datetime()
      })
      CREATE (u)-[:REVIEWED]->(rev)-[:ON]->(b)
      RETURN rev, u.name AS reviewerName
    `;
        const params = { bookId, userId, revId, message, rating };
        const result = await this.neo4j.write(query, params);
        if (!result.records || result.records.length === 0) {
            throw new common_1.NotFoundException("Book or user not found");
        }
        const rec = result.records[0];
        const node = rec.get("rev");
        const reviewerName = rec.get("reviewerName");
        const review = {
            id: node.properties.id,
            message: node.properties.message,
            rating: node.properties.rating,
            reviewerName,
            createdAt: node.properties.createdAt &&
                typeof node.properties.createdAt.toString === "function"
                ? node.properties.createdAt.toString()
                : node.properties.createdAt,
        };
        return review;
    }
    async createBook(createBookDto) {
        const pages = parseInt(createBookDto.pages, 10) || 340;
        const totalCopies = parseInt(createBookDto.totalCopies, 10) || 0;
        const bookId = (0, crypto_1.randomUUID)();
        const query = `
       MERGE (g:Genre { name: $genreName })
      CREATE (b:Book {
        id: $bookId,
        title: $title,
        author: $author,
        isbn: $isbn,
        description: $description,
        pages: $pages,
        language: $language,
        coverImage: $coverImage,
        createdAt: $createdAt
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
            genreName: createBookDto.genre,
            pages: pages,
            language: createBookDto.language,
            coverImage: createBookDto.coverImage,
            createdAt: new Date().toISOString(),
        });
        if (result && totalCopies > 0) {
            await this.addBookCopy(bookId, totalCopies);
        }
        return this.mapNeo4jToBook(result.records[0].get("b"));
    }
    async updateBook(bookId, updateBookDto) {
        const pages = parseInt(updateBookDto.pages, 10) || 340;
        const query = `
      MATCH (b:Book { id: $bookId })
      OPTIONAL MATCH (b)-[oldRel:BELONGS_TO]->(oldG:Genre)
      SET
        b.title = $title,
        b.author = $author,
        b.isbn = $isbn,
        b.description = $description,
        b.pages = $pages,
        b.language = $language,
        b.coverImage = $coverImage
      WITH b, oldRel, oldG
      // delete existing relationship only if it points to a different genre
      FOREACH (_ IN CASE WHEN oldRel IS NOT NULL AND (oldG.name IS NULL OR oldG.name <> $genreName) THEN [1] ELSE [] END |
        DELETE oldRel
      )
      MERGE (newG:Genre { name: $genreName })
      MERGE (b)-[:BELONGS_TO]->(newG)
      RETURN b
    `;
        const result = await this.neo4j.write(query, {
            bookId,
            title: updateBookDto.title,
            author: updateBookDto.author,
            isbn: updateBookDto.isbn,
            description: updateBookDto.description,
            genreName: updateBookDto.genre,
            pages: pages,
            language: updateBookDto.language,
            coverImage: updateBookDto.coverImage,
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
          createdAt: $createdAt
        })
        CREATE (b)-[:HAS_COPY]->(bc)
        RETURN bc
      `;
            await this.neo4j.write(query, {
                bookId,
                copyId,
                createdAt: new Date().toISOString(),
            });
        }
        return { bookId, copiesTotalAdded: quantity };
    }
    async removeBookCopies(bookId, quantity = 1) {
        const query = `
      MATCH (b:Book { id: $bookId })-[:HAS_COPY]->(bc:BookCopy)
      WHERE bc.status = 'AVAILABLE'
      WITH bc
      ORDER BY bc.createdAt ASC
      WITH collect(bc)[0..$quantity] AS toRemove
      UNWIND toRemove AS rem
      DETACH DELETE rem
      RETURN count(rem) AS deleted
    `;
        const result = await this.neo4j.write(query, { bookId, quantity });
        const rawDeleted = result.records && result.records[0]
            ? result.records[0].get("deleted")
            : 0;
        const deleted = rawDeleted && typeof rawDeleted.toNumber === "function"
            ? rawDeleted.toNumber()
            : Number(rawDeleted) || 0;
        return { bookId, deleted };
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
    // ...existing code...
    async searchBooks(query, limit = 20, skip = 0) {
        const searchQuery = `
      MATCH (b:Book)
      OPTIONAL MATCH (b)-[:BELONGS_TO]->(g:Genre)
      OPTIONAL MATCH (b)-[:HAS_COPY]->(bc:BookCopy)
      OPTIONAL MATCH (bc)<-[:OF_COPY]-(br:Borrow)
      OPTIONAL MATCH (bc)<-[:OF_COPY]-(brActive:Borrow { status: 'ACTIVE' })
      OPTIONAL MATCH (b)<-[:OF_BOOK]-(res:Reservation { status: 'ACTIVE' })
      OPTIONAL MATCH (b)<-[:ON]-(rev:Review)
      WHERE
        b.title CONTAINS $query OR
        b.author CONTAINS $query OR
        b.isbn CONTAINS $query OR
        (g.name IS NOT NULL AND g.name CONTAINS $query)
      WITH b, g, COLLECT(DISTINCT bc) AS copies,
           AVG(rev.rating) AS avgRating,
           COUNT(DISTINCT br) AS borrowCount,
           COUNT(DISTINCT rev) AS reviewCount,
           COUNT(DISTINCT brActive) AS borrowedCopies,
           COUNT(DISTINCT res) AS activeReservations
      RETURN b AS book,
             g.name AS genre,
             copies AS copies,
             avgRating AS avgRating,
             borrowCount AS borrowCount,
             reviewCount AS reviewCount,
             borrowedCopies AS borrowedCopies,
             activeReservations AS activeReservations,
             // demand pressure = percentage of copies currently in demand (borrowed + active reservations) / total copies
             CASE WHEN size(copies) = 0 THEN 0
                  ELSE ROUND(((toFloat(borrowedCopies) + toFloat(activeReservations)) / toFloat(size(copies))) * 100.0, 2)
             END AS demandPressure,
             CASE WHEN size(copies) = 0 THEN false
                  WHEN ((toFloat(borrowedCopies) + toFloat(activeReservations)) / toFloat(size(copies))) >= 0.7 THEN true
                  ELSE false
             END AS highDemand
      SKIP $skip
      LIMIT $limit
    `;
        const result = await this.neo4j.read(searchQuery, { query, skip, limit });
        const toNumber = (v) => v && typeof v.toNumber === "function"
            ? v.toNumber()
            : v !== undefined && v !== null
                ? Number(v)
                : null;
        return result.records.map((r) => {
            const bookNode = r.get("book");
            const genre = r.get("genre") ?? null;
            const copies = r.get("copies") || [];
            const rawAvg = r.get("avgRating");
            const rawBorrowCount = r.get("borrowCount");
            const rawReviewCount = r.get("reviewCount");
            const rawBorrowedCopies = r.get("borrowedCopies");
            const rawActiveReservations = r.get("activeReservations");
            const rawDemandPressure = r.get("demandPressure");
            const rawHighDemand = r.get("highDemand");
            // build a node-like object compatible with mapNeo4jToBook
            const properties = {
                ...(bookNode && bookNode.properties ? bookNode.properties : {}),
                genre,
                totalCopies: copies.length,
                availableCopies: copies.filter((c) => c.properties?.status === "AVAILABLE").length,
                copies: copies.map((c) => ({
                    id: c.properties?.id,
                    status: c.properties?.status,
                })),
                avgRating: rawAvg === null || rawAvg === undefined ? null : toNumber(rawAvg),
                borrowCount: toNumber(rawBorrowCount) ?? 0,
                reviewCount: toNumber(rawReviewCount) ?? 0,
            };
            const mapped = this.mapNeo4jToBook({ properties });
            // attach demand-related fields
            const borrowedCopies = rawBorrowedCopies && typeof rawBorrowedCopies.toNumber === "function"
                ? rawBorrowedCopies.toNumber()
                : Number(rawBorrowedCopies) || 0;
            const activeReservations = rawActiveReservations &&
                typeof rawActiveReservations.toNumber === "function"
                ? rawActiveReservations.toNumber()
                : Number(rawActiveReservations) || 0;
            const demandPressure = rawDemandPressure && typeof rawDemandPressure.toNumber === "function"
                ? rawDemandPressure.toNumber()
                : rawDemandPressure !== undefined && rawDemandPressure !== null
                    ? Number(rawDemandPressure)
                    : 0;
            const highDemand = mapped.availableCopies <= 2 && mapped.totalCopies > 0 ? true : false;
            return {
                ...mapped,
                borrowedCopies,
                activeReservations,
                demandPressure, // percentage 0-100
                highDemand, // boolean: needs more copies when true
            };
        });
    }
    // ...existing code...
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
        const props = node.properties || node.properties || {};
        const rawAvg = props.avgRating;
        const avgRating = rawAvg === null || rawAvg === undefined
            ? null
            : typeof rawAvg.toNumber === "function"
                ? rawAvg.toNumber()
                : Number(rawAvg);
        const rawBorrowCount = props.borrowCount;
        const borrowCount = rawBorrowCount && typeof rawBorrowCount.toNumber === "function"
            ? rawBorrowCount.toNumber()
            : rawBorrowCount !== undefined && rawBorrowCount !== null
                ? Number(rawBorrowCount)
                : 0;
        const rawReviewCount = props.reviewCount;
        const reviewCount = rawReviewCount && typeof rawReviewCount.toNumber === "function"
            ? rawReviewCount.toNumber()
            : rawReviewCount !== undefined && rawReviewCount !== null
                ? Number(rawReviewCount)
                : 0;
        return {
            id: node.properties.id,
            title: node.properties.title,
            author: node.properties.author,
            isbn: node.properties.isbn,
            description: node.properties.description,
            publicationYear: node.properties.publicationYear,
            genre: node.properties.genre,
            publisher: node.properties.publisher,
            pages: node.properties.pages,
            language: node.properties.language,
            coverImage: node.properties.coverImage,
            createdAt: node.properties.createdAt
                ? new Date(node.properties.createdAt)
                : null,
            totalCopies: node.properties?.totalCopies ??
                (props?.copies ? props.copies.length : undefined),
            availableCopies: typeof node.properties?.availableCopies !== "undefined"
                ? node.properties.availableCopies
                : props?.copies
                    ? props.copies.filter((c) => c.status === "AVAILABLE").length
                    : 0,
            copies: props?.copies || node.properties?.copies || [],
            rating: Number(avgRating),
            borrowCount,
            reviewCount,
        };
    }
};
exports.BooksService = BooksService;
exports.BooksService = BooksService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [neo4j_service_1.Neo4jService])
], BooksService);
