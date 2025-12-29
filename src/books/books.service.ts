import { Injectable, NotFoundException } from "@nestjs/common";
import { Neo4jService } from "../neo4j/neo4j.service";
import type { CreateBookDto } from "./dto/create-book.dto";
import { randomUUID as uuid } from "crypto";

@Injectable()
export class BooksService {
 
  constructor(private neo4j: Neo4jService) {}

   async getComments(bookId: string) {
    const query = `
      MATCH (b:Book { id: $bookId })<-[:ON]-(rev:Review)<-[:REVIEWED]-(u:User)
      RETURN rev, u.name AS reviewerName, u.id AS reviewerId
      ORDER BY rev.createdAt DESC
    `;
    const result = await this.neo4j.read(query, { bookId });
    if (!result.records || result.records.length === 0) return [];

    return result.records.map((rec: any) => {
      const node = rec.get("rev");
      const reviewerName = rec.get("reviewerName");
      const reviewerId = rec.get("reviewerId");

      return {
        id: node.properties.id,
        message: node.properties.message,
        rating: node.properties.rating,
        reviewerName,
        reviewerId,
        createdAt:
          node.properties.createdAt && typeof node.properties.createdAt.toString === "function"
            ? node.properties.createdAt.toString()
            : node.properties.createdAt,
      };
    });
  }


  async createComment(bookId: string, userId: string, message: string, rating: number) {
    const revId = uuid();
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
      throw new NotFoundException("Book or user not found");
    }

    const rec = result.records[0];
    const node = rec.get("rev");
    const reviewerName = rec.get("reviewerName");

    const review = {
      id: node.properties.id,
      message: node.properties.message,
      rating: node.properties.rating,
      reviewerName,
      createdAt:
        node.properties.createdAt && typeof node.properties.createdAt.toString === "function"
          ? node.properties.createdAt.toString()
          : node.properties.createdAt,
    };

    return review;
  }

  async createBook(createBookDto: CreateBookDto) {
    const bookId = uuid();
    const query = `
       MERGE (g:Genre { name: $genreName })
      CREATE (b:Book {
        id: $bookId,
        title: $title,
        author: $author,
        isbn: $isbn,
        description: $description,
        publicationYear: $publicationYear,
        publisher: $publisher,
        pages: $pages,
        language: $language,
        coverImage: $coverImage,
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
      publisher: createBookDto.publisher,
      pages: createBookDto.pages,
      language: createBookDto.language,
      coverImage: createBookDto.coverImage,
    });
    return this.mapNeo4jToBook(result.records[0].get("b"));
  }

  async addBookCopy(bookId: string, quantity = 1) {
    const copyIds = Array.from({ length: quantity }, () => uuid());
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

  async getBook(bookId: string) {
    const query = `
      MATCH (b:Book { id: $bookId })
      OPTIONAL MATCH (b)-[:BELONGS_TO]->(g:Genre)
      OPTIONAL MATCH (b)-[:HAS_COPY]->(bc:BookCopy)
      RETURN b, g, COLLECT(bc) as copies
    `;

    const result = await this.neo4j.read(query, { bookId });
    if (result.records.length === 0) {
      throw new NotFoundException("Book not found");
    }

    const record = result.records[0];
    const book = this.mapNeo4jToBook(record.get("b"));
    const genre = record.get("g");
    const copies = record.get("copies");

    return {
      ...book,
      genre: genre ? genre.properties.name : null,
      totalCopies: copies.length,
      availableCopies: copies.filter(
        (c: any) => c.properties.status === "AVAILABLE"
      ).length,
      copies: copies.map((c: any) => ({
        id: c.properties.id,
        status: c.properties.status,
      })),
    };
  }

  async searchBooks(query: string, limit = 20, skip = 0) {
    const searchQuery = `
      MATCH (b:Book)
      OPTIONAL MATCH (b)-[:BELONGS_TO]->(g:Genre)
      OPTIONAL MATCH (b)-[:HAS_COPY]->(bc:BookCopy)
      WHERE
      b.title CONTAINS $query OR
      b.author CONTAINS $query OR
      b.isbn CONTAINS $query OR
      (g.name IS NOT NULL AND g.name CONTAINS $query)
      WITH b, g, COLLECT(bc) AS copies
      RETURN {
      properties: b {
        .*, 
        genre: g.name, 
        totalCopies: size(copies), 
        availableCopies: size([c IN copies WHERE c.status = 'AVAILABLE']),
        copies: [c IN copies | { id: c.id, status: c.status }]
      }
      } AS b
      SKIP $skip
      LIMIT $limit
    `;

    const result = await this.neo4j.read(searchQuery, { query, skip, limit });
    return result.records.map((r: any) => this.mapNeo4jToBook(r.get("b")));
  }

  async getAvailableCopies(bookId: string) {
    const query = `
      MATCH (b:Book { id: $bookId })-[:HAS_COPY]->(bc:BookCopy { status: 'AVAILABLE' })
      RETURN COLLECT(bc.id) as copyIds
    `;

    const result = await this.neo4j.read(query, { bookId });
    return result.records[0].get("copyIds");
  }

  async getBookCopyStatus(copyId: string) {
    const query = `
      MATCH (bc:BookCopy { id: $copyId })
      RETURN bc
    `;

    const result = await this.neo4j.read(query, { copyId });
    if (result.records.length === 0) {
      throw new NotFoundException("Book copy not found");
    }

    return result.records[0].get("bc").properties;
  }

  private mapNeo4jToBook(node: any) {
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
      createdAt: new Date(node.properties.createdAt),
      totalCopies: node.properties?.copies?.length,
      availableCopies: node.properties?.copies ? node.properties.copies.filter((c: any) => c.status === "AVAILABLE").length : 0,
      copies: node.properties?.copies || [],
    };
  }
}
