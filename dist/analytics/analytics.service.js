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
      WITH u,
           u.score AS currentScore,
           u.tier AS tier,
           u.createdAt AS createdAt,
           (CASE WHEN u.name IS NOT NULL THEN 1 ELSE 0 END +
            CASE WHEN u.email IS NOT NULL THEN 1 ELSE 0 END +
            CASE WHEN u.imageUrl IS NOT NULL THEN 1 ELSE 0 END) AS filledFields,
           COUNT(DISTINCT b) AS borrowCount,
           COUNT(DISTINCT r) AS reservationCount,
           COUNT(DISTINCT rev) AS reviewCount,
           COLLECT(DISTINCT g.name) AS genresRead,
           COUNT(DISTINCT se) AS totalScoreEvents
      WITH u, currentScore, tier, createdAt, borrowCount, reservationCount, reviewCount, genresRead, totalScoreEvents, filledFields,
           CASE WHEN 3 > 0 THEN toFloat(filledFields) / 3.0 * 100.0 ELSE 0 END AS progress
      RETURN {
        borrowCount: borrowCount,
        reservationCount: reservationCount,
        reviewCount: reviewCount,
        genresRead: genresRead,
        totalScoreEvents: totalScoreEvents,
        currentScore: currentScore,
        tier: tier,
        createdAt: createdAt,
        progress: progress
      } as analytics
    `;
        const result = await this.neo4j.read(query, { userId });
        if (!result.records || result.records.length === 0) {
            return {
                borrowCount: 0,
                reservationCount: 0,
                reviewCount: 0,
                genresRead: [],
                totalScoreEvents: 0,
                currentScore: 0,
                tier: null,
                createdAt: null,
                progress: 0,
            };
        }
        const raw = result.records[0].get("analytics");
        return {
            borrowCount: raw.borrowCount && typeof raw.borrowCount.toNumber === "function"
                ? raw.borrowCount.toNumber()
                : Number(raw.borrowCount) || 0,
            reservationCount: raw.reservationCount && typeof raw.reservationCount.toNumber === "function"
                ? raw.reservationCount.toNumber()
                : Number(raw.reservationCount) || 0,
            reviewCount: raw.reviewCount && typeof raw.reviewCount.toNumber === "function"
                ? raw.reviewCount.toNumber()
                : Number(raw.reviewCount) || 0,
            genresRead: raw.genresRead || [],
            totalScoreEvents: raw.totalScoreEvents && typeof raw.totalScoreEvents.toNumber === "function"
                ? raw.totalScoreEvents.toNumber()
                : Number(raw.totalScoreEvents) || 0,
            currentScore: raw.currentScore && typeof raw.currentScore.toNumber === "function"
                ? raw.currentScore.toNumber()
                : raw.currentScore ?? 0,
            tier: raw.tier ?? null,
            createdAt: raw.createdAt && typeof raw.createdAt.toString === "function"
                ? raw.createdAt.toString()
                : raw.createdAt ?? null,
            progress: raw.progress && typeof raw.progress.toNumber === "function"
                ? raw.progress.toNumber()
                : Number(raw.progress) || 0,
        };
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
      MATCH (user:User { id: $userId })-[:BORROWED]->(b:Borrow)-[:OF_COPY]->(bc:BookCopy)<-[:HAS_COPY]-(book:Book)-[:BELONGS_TO]->(g:Genre)
      OPTIONAL MATCH (user)-[:REVIEWED]->(rev:Review)-[:ON]->(book)
      WITH g.name AS genre, COUNT(DISTINCT b) AS borrowCount, SUM(COALESCE(rev.rating, 0)) AS totalScore
      RETURN genre, borrowCount AS count, totalScore
      ORDER BY count DESC
    `;
        const result = await this.neo4j.read(query, { userId });
        return result.records.map((r) => {
            const rawCount = r.get("count");
            const count = rawCount && typeof rawCount.toNumber === "function"
                ? rawCount.toNumber()
                : Number(rawCount) || 0;
            const rawTotal = r.get("totalScore");
            const totalScore = rawTotal && typeof rawTotal.toNumber === "function"
                ? rawTotal.toNumber()
                : rawTotal !== undefined && rawTotal !== null
                    ? Number(rawTotal)
                    : 0;
            return {
                genre: r.get("genre"),
                count,
                score: totalScore,
            };
        });
    }
    async getLateReturnStatistics() {
        const query = `
      MATCH (b:Borrow { status: 'COMPLETED' })
      WHERE b.returnDate > b.dueDate
      WITH ROUND((b.returnDate.epochMillis - b.dueDate.epochMillis) / (24.0 * 60 * 60 * 1000)) AS lateDays
      WITH COUNT(*) AS totalLateReturns, AVG(lateDays) AS averageLateDays, MAX(lateDays) AS maxLateDays
      CALL {
        MATCH (x:Borrow { status: 'COMPLETED' })
        RETURN COUNT(x) AS totalCompleted
      }
      RETURN {
        totalLateReturns: totalLateReturns,
        averageLateDays: averageLateDays,
        maxLateDays: maxLateDays,
        lateReturnRate: CASE 
          WHEN totalCompleted > 0 
          THEN ROUND(toFloat(totalLateReturns) / toFloat(totalCompleted) * 100.0, 2) 
          ELSE 0 
        END
      } AS stats
    `;
        const result = await this.neo4j.read(query);
        if (!result.records || result.records.length === 0)
            return { totalLateReturns: 0, averageLateDays: null, maxLateDays: null, lateReturnRate: 0 };
        return result.records[0].get("stats");
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [neo4j_service_1.Neo4jService])
], AnalyticsService);
