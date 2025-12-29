import { Injectable } from "@nestjs/common";
import { Neo4jService } from "../neo4j/neo4j.service";
import { ScoreService } from "../score/score.service";
import { randomUUID as uuid } from "crypto";
import type { CreateReservationDto } from "./dto/create-reservation.dto";

@Injectable()
export class ReservationService {
  constructor(
    private neo4j: Neo4jService,
    private scoreService: ScoreService
  ) {}

  async createReservation(
    userId: string,
    createReservationDto: CreateReservationDto
  ) {
    const reservationId = uuid();
    const startDate = new Date(createReservationDto.startDate);
    const endDate = new Date(
      startDate.getTime() +
        createReservationDto.durationDays * 24 * 60 * 60 * 1000
    );

    // Get user's priority based on score
    const scoreData = await this.scoreService.getUserScore(userId);
    const priority = this.calculatePriority(scoreData.currentScore);

    const query = `
      MATCH (u:User { id: $userId })
      MATCH (b:Book { id: $bookId })
      CREATE (r:Reservation {
        id: $reservationId,
        startDate: $startDate,
        endDate: $endDate,
        priority: $priority,
        status: 'ACTIVE',
        createdAt: datetime()
      })
      CREATE (u)-[:RESERVED]->(r)
      CREATE (r)-[:OF_BOOK]->(b)
      RETURN r
    `;

    await this.neo4j.write(query, {
      userId,
      bookId: createReservationDto.bookId,
      reservationId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      priority,
    });

    return {
      id: reservationId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      priority,
      status: "ACTIVE",
    };
  }

  async cancelReservation(reservationId: string) {
    const query = `
      MATCH (r:Reservation { id: $reservationId })-[:OF_BOOK]->(b:Book)
      MATCH (u:User)-[:RESERVED]->(r)
      SET r.status = 'CANCELLED'
      RETURN r, u
    `;

    const result = await this.neo4j.write(query, { reservationId });
    const record = result.records[0];

    return {
      id: reservationId,
      status: "CANCELLED",
    };
  }

  async getReservationQueue(bookId: string) {
    const query = `
      MATCH (r:Reservation { status: 'ACTIVE' })-[:OF_BOOK]->(b:Book { id: $bookId })
      MATCH (u:User)-[:RESERVED]->(r)
      RETURN r, u.id as userId, u.name as userName
      ORDER BY r.priority DESC, r.createdAt ASC
    `;

    const result = await this.neo4j.read(query, { bookId });
    return result.records.map((r: any, index: any) => ({
      position: index + 1,
      reservationId: r.get("r").properties.id,
      userId: r.get("userId"),
      userName: r.get("userName"),
      priority: r.get("r").properties.priority,
      startDate: r.get("r").properties.startDate,
      endDate: r.get("r").properties.endDate,
    }));
  }

  async getUserReservations(userId: string) {
    const query = `
      MATCH (u:User { id: $userId })-[:RESERVED]->(r:Reservation)-[:OF_BOOK]->(b:Book)
      WHERE r.status = 'ACTIVE'
      RETURN r, b
      ORDER BY r.createdAt DESC
    `;

    const result = await this.neo4j.read(query, { userId });
    return result.records.map((r: any) => ({
      id: r.get("r").properties.id,
      book: {
        id: r.get("b").properties.id,
        title: r.get("b").properties.title,
        author: r.get("b").properties.author,
        isbn: r.get("b").properties.isbn,
        description: r.get("b").properties.description,
        publicationYear: r.get("b").properties.publicationYear,
        genre: r.get("b").properties.genre,
      },
      startDate: r.get("r").properties.startDate,
      endDate: r.get("r").properties.endDate,
      priority: r.get("r").properties.priority,
      status: r.get("r").properties.status,
      durationDays:  Math.ceil(
        (new Date(r.get("r").properties.endDate).getTime() -
          new Date(r.get("r").properties.startDate).getTime()) /
          (1000 * 60 * 60 * 24)
      ),
    }));
  }

  async getEarliestAvailableSlot(bookId: string) {
    const query = `
      MATCH (r:Reservation { status: 'ACTIVE' })-[:OF_BOOK]->(b:Book { id: $bookId })
      RETURN r
      ORDER BY r.endDate ASC
      LIMIT 1
    `;

    const result = await this.neo4j.read(query, { bookId });
    if (result.records.length === 0) {
      return {
        availableFrom: new Date().toISOString(),
        message: "Book is available now",
      };
    }

    const earliestReservation = result.records[0].get("r").properties;
    return {
      availableFrom: earliestReservation.endDate,
      message: `Book will be available from ${earliestReservation.endDate}`,
    };
  }

  private calculatePriority(score: number): number {
    if (score >= 300) return 5;
    if (score >= 200) return 4;
    if (score >= 150) return 3;
    if (score >= 100) return 2;
    return 1;
  }
}
