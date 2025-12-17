import { Injectable } from "@nestjs/common";
import { Neo4jService } from "../neo4j/neo4j.service";

@Injectable()
export class AnalyticsService {
  constructor(private neo4j: Neo4jService) {}

  async getUserAnalytics(userId: string) {
    const query = `
      MATCH (u:User { id: $userId })
      OPTIONAL MATCH (u)-[:BORROWED]->(b:Borrow)
      OPTIONAL MATCH (u)-[:RESERVED]->(r:Reservation)
      OPTIONAL MATCH (u)-[:REVIEWED]->(rev:Review)-[:ON]->(book:Book)-[:BELONGS_TO]->(g:Genre)
      OPTIONAL MATCH (u)-[:HAS_SCORE_EVENT]->(se:ScoreEvent)
      RETURN {
        borrowCount: COUNT(DISTINCT b),
        reservationCount: COUNT(DISTINCT r),
        reviewCount: COUNT(DISTINCT rev),
        genresRead: COLLECT(DISTINCT g.name),
        totalScoreEvents: COUNT(DISTINCT se),
        currentScore: u.score,
        tier: u.tier
      } as analytics
    `;

    const result = await this.neo4j.read(query, { userId });
    return result.records[0].get("analytics");
  }

  async getTrendingBooks(limit = 10) {
    const query = `
      MATCH (book:Book)<-[:OF_COPY]-(:BookCopy)<-[:OF_COPY]-(b:Borrow)
      WITH book, COUNT(b) as borrowCount
      MATCH (book)<-[:ON]-(rev:Review)
      WITH book, borrowCount, AVG(rev.rating) as avgRating, COUNT(rev) as reviewCount
      RETURN {
        id: book.id,
        title: book.title,
        author: book.author,
        borrowCount: borrowCount,
        avgRating: avgRating,
        reviewCount: reviewCount
      } as bookStats
      ORDER BY borrowCount DESC
      LIMIT $limit
    `;

    const result = await this.neo4j.read(query, { limit });
    return result.records.map((r: any) => r.get("bookStats"));
  }

  async getMostReservedBooks(limit = 10) {
    const query = `
      MATCH (book:Book)<-[:OF_BOOK]-(r:Reservation { status: 'ACTIVE' })
      WITH book, COUNT(r) as reservationCount
      RETURN {
        id: book.id,
        title: book.title,
        author: book.author,
        reservationCount: reservationCount
      } as bookStats
      ORDER BY reservationCount DESC
      LIMIT $limit
    `;

    const result = await this.neo4j.read(query, { limit });
    return result.records.map((r: any) => r.get("bookStats"));
  }

  async getDemandVsSupply() {
    const query = `
      MATCH (book:Book)-[:HAS_COPY]->(bc:BookCopy)
      OPTIONAL MATCH (bc)<-[:OF_COPY]-(borrow:Borrow { status: 'ACTIVE' })
      OPTIONAL MATCH (book)<-[:OF_BOOK]-(r:Reservation { status: 'ACTIVE' })
      WITH book, 
           COUNT(DISTINCT bc) as totalCopies,
           COUNT(DISTINCT borrow) as borrowedCopies,
           COUNT(DISTINCT r) as activeReservations
      RETURN {
        id: book.id,
        title: book.title,
        totalCopies: totalCopies,
        borrowedCopies: borrowedCopies,
        availableCopies: totalCopies - borrowedCopies,
        demandRatio: CASE WHEN totalCopies > 0 THEN (borrowedCopies + activeReservations) / toFloat(totalCopies) ELSE 0 END
      } as stats
      ORDER BY stats.demandRatio DESC
    `;

    const result = await this.neo4j.read(query);
    return result.records.map((r: any) => r.get("stats"));
  }

  async getGenreDistribution(userId: string) {
    const query = `
      MATCH (u:User { id: $userId })-[:BORROWED]->(b:Borrow)-[:OF_COPY]->(bc:BookCopy)<-[:HAS_COPY]-(book:Book)-[:BELONGS_TO]->(g:Genre)
      RETURN g.name as genre, COUNT(DISTINCT b) as count
      ORDER BY count DESC
    `;

    const result = await this.neo4j.read(query, { userId });
    return result.records.map((r: any) => ({
      genre: r.get("genre"),
      count: r.get("count").toNumber(),
    }));
  }

  async getLateReturnStatistics() {
    const query = `
      MATCH (b:Borrow { status: 'COMPLETED' })
      WHERE b.returnDate > b.dueDate
      WITH b, 
           ROUND((b.returnDate.epochMillis - b.dueDate.epochMillis) / (24.0 * 60 * 60 * 1000)) as lateDays
      RETURN {
        totalLateReturns: COUNT(b),
        averageLateDays: AVG(lateDays),
        maxLateDays: MAX(lateDays),
        lateReturnRate: ROUND(COUNT(b) / (SELECT COUNT(*) FROM Borrow WHERE status = 'COMPLETED') * 100.0, 2)
      } as stats
    `;

    const result = await this.neo4j.read(query);
    return result.records[0].get("stats");
  }
}
