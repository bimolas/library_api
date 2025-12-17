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
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const neo4j_service_1 = require("../neo4j/neo4j.service");
let AnalyticsService = class AnalyticsService {
    constructor(neo4j) {
        this.neo4j = neo4j;
    }
    async getUserAnalytics(userId) {
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
        return result.records.map((r) => r.get("bookStats"));
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
        return result.records.map((r) => r.get("bookStats"));
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
        return result.records.map((r) => r.get("stats"));
    }
    async getGenreDistribution(userId) {
        const query = `
      MATCH (u:User { id: $userId })-[:BORROWED]->(b:Borrow)-[:OF_COPY]->(bc:BookCopy)<-[:HAS_COPY]-(book:Book)-[:BELONGS_TO]->(g:Genre)
      RETURN g.name as genre, COUNT(DISTINCT b) as count
      ORDER BY count DESC
    `;
        const result = await this.neo4j.read(query, { userId });
        return result.records.map((r) => ({
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
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [neo4j_service_1.Neo4jService])
], AnalyticsService);
