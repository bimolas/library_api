import { Injectable, NotFoundException } from "@nestjs/common";
import { Neo4jService } from "../neo4j/neo4j.service";
import type { CreateBookDto } from "./dto/create-book.dto";
import { randomUUID as uuid } from "crypto";

@Injectable()
export class BooksService {
  constructor(private neo4j: Neo4jService) {}

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
    console.log("🚀 ~ BooksService ~ createBook ~ result:", result);
    return this.mapNeo4jToBook(result.records[0].get("b"));
  }

  async addBookCopy(bookId: string, quantity = 1) {
    console.log("🚀 ~ BooksService ~ addBookCopy ~ quantity :", quantity);
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
      WHERE 
        b.title CONTAINS $query OR 
        b.author CONTAINS $query OR 
        b.isbn CONTAINS $query
      RETURN b
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
      createdAt: node.properties.createdAt,
    };
  }
}
