import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { Neo4jService } from "../neo4j/neo4j.service";
import { ScoreService, ScoreEventType } from "../score/score.service";
import { BooksService } from "../books/books.service";
import { v4 as uuid } from "uuid";
import type { CreateBorrowDto } from "./dto/create-borrow.dto";

@Injectable()
export class BorrowingService {
  constructor(
    private neo4j: Neo4jService,
    private scoreService: ScoreService,
    private booksService: BooksService
  ) {}

  async borrowBook(userId: string, createBorrowDto: CreateBorrowDto) {
    const borrowId = uuid();
    const privileges = await this.scoreService.getPrivileges(userId);

    // Check user hasn't reached max concurrent borrows
    const activeBorrows = await this.getActiveBorrowCount(userId);
    if (activeBorrows >= privileges.maxConcurrentBorrows) {
      throw new BadRequestException("Maximum concurrent borrows reached");
    }

    // Check copy availability
    const availableCopies = await this.booksService.getAvailableCopies(
      createBorrowDto.bookId
    );
    if (availableCopies.length === 0) {
      throw new NotFoundException("No available copies");
    }

    const selectedCopyId = availableCopies[0];
    const durationDays =
      createBorrowDto.durationDays || privileges.borrowDuration;

    const borrowDate = new Date();
    const dueDate = new Date(
      borrowDate.getTime() + durationDays * 24 * 60 * 60 * 1000
    );

    const query = `
      MATCH (u:User { id: $userId })
      MATCH (bc:BookCopy { id: $copyId })
      CREATE (b:Borrow {
        id: $borrowId,
        borrowDate: $borrowDate,
        dueDate: $dueDate,
        returnDate: null,
        status: 'ACTIVE'
      })
      CREATE (u)-[:BORROWED]->(b)
      CREATE (b)-[:OF_COPY]->(bc)
      SET bc.status = 'BORROWED'
      RETURN b, bc
    `;

    const result = await this.neo4j.write(query, {
      userId,
      copyId: selectedCopyId,
      borrowId,
      borrowDate: borrowDate.toISOString(),
      dueDate: dueDate.toISOString(),
    });

    return {
      id: borrowId,
      status: "ACTIVE",
      borrowDate: borrowDate.toISOString(),
      dueDate: dueDate.toISOString(),
      copyId: selectedCopyId,
    };
  }

  async returnBook(borrowId: string, userId: string) {
    const query = `
      MATCH (b:Borrow { id: $borrowId })-[:OF_COPY]->(bc:BookCopy)
      MATCH (u:User { id: $userId })-[:BORROWED]->(b)
      SET b.status = 'COMPLETED',
          b.returnDate = datetime(),
          bc.status = 'AVAILABLE'
      RETURN b, u, bc
    `;

    const result = await this.neo4j.write(query, { borrowId, userId });
    const record = result.records[0];
    const borrow = record.get("b");
    const user = record.get("u");

    // Calculate score impact
    const dueDate = new Date(borrow.properties.dueDate);
    const returnDate = new Date(borrow.properties.returnDate);
    const isOnTime = returnDate <= dueDate;

    if (isOnTime) {
      await this.scoreService.recordScoreEvent(
        user.properties.id,
        ScoreEventType.ON_TIME_RETURN
      );
    } else {
      const lateDays = Math.floor(
        (returnDate.getTime() - dueDate.getTime()) / (24 * 60 * 60 * 1000)
      );
      const penalty = Math.min(lateDays * 5, 100); // Max -100 points
      await this.scoreService.recordScoreEvent(
        user.properties.id,
        ScoreEventType.LATE_RETURN,
        -penalty
      );
    }

    return {
      id: borrowId,
      status: "COMPLETED",
      returnDate: borrow.properties.returnDate,
      isOnTime,
    };
  }

  async getUserBorrows(userId: string, status?: string) {
    const statusFilter = status ? ` AND b.status = $status` : "";
    const query = `
      MATCH (u:User { id: $userId })-[:BORROWED]->(b:Borrow)-[:OF_COPY]->(bc:BookCopy)
      MATCH (b)-[:OF_COPY]->(bc)<-[:HAS_COPY]-(book:Book)
      WHERE true${statusFilter}
      RETURN b, book, bc
      ORDER BY b.borrowDate DESC
    `;

    const result = await this.neo4j.read(query, { userId, status });
    return result.records.map((r: any) => ({
      id: r.get("b").properties.id,
      status: r.get("b").properties.status,
      borrowDate: r.get("b").properties.borrowDate,
      dueDate: r.get("b").properties.dueDate,
      returnDate: r.get("b").properties.returnDate,
      book: {
        id: r.get("book").properties.id,
        title: r.get("book").properties.title,
      },
      copy: {
        id: r.get("bc").properties.id,
        status: r.get("bc").properties.status,
      },
    }));
  }

  async getActiveBorrowCount(userId: string): Promise<number> {
    const query = `
      MATCH (u:User { id: $userId })-[:BORROWED]->(b:Borrow { status: 'ACTIVE' })
      RETURN COUNT(b) as count
    `;

    const result = await this.neo4j.read(query, { userId });
    return result.records[0].get("count").toNumber();
  }

  async getOverdueBooks(userId: string) {
    const now = new Date().toISOString();
    const query = `
      MATCH (u:User { id: $userId })-[:BORROWED]->(b:Borrow { status: 'ACTIVE' })-[:OF_COPY]->(bc:BookCopy)
      MATCH (b)-[:OF_COPY]->(bc)<-[:HAS_COPY]-(book:Book)
      WHERE b.dueDate < $now
      RETURN b, book, bc
    `;

    const result = await this.neo4j.read(query, { userId, now });
    return result.records.map((r: any) => ({
      id: r.get("b").properties.id,
      book: r.get("book").properties.title,
      dueDate: r.get("b").properties.dueDate,
      daysOverdue: Math.floor(
        (new Date(now).getTime() -
          new Date(r.get("b").properties.dueDate).getTime()) /
          (24 * 60 * 60 * 1000)
      ),
    }));
  }
}
