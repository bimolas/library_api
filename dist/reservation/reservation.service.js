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
exports.ReservationService = void 0;
const common_1 = require("@nestjs/common");
const neo4j_service_1 = require("../neo4j/neo4j.service");
const score_service_1 = require("../score/score.service");
const crypto_1 = require("crypto");
let ReservationService = class ReservationService {
    constructor(neo4j, scoreService) {
        this.neo4j = neo4j;
        this.scoreService = scoreService;
    }
    async createReservation(userId, createReservationDto) {
        const reservationId = (0, crypto_1.randomUUID)();
        const startDate = new Date(createReservationDto.startDate);
        const endDate = new Date(startDate.getTime() +
            createReservationDto.durationDays * 24 * 60 * 60 * 1000);
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
    async cancelReservation(reservationId) {
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
    async getReservationQueue(bookId) {
        const query = `
      MATCH (r:Reservation { status: 'ACTIVE' })-[:OF_BOOK]->(b:Book { id: $bookId })
      MATCH (u:User)-[:RESERVED]->(r)
      RETURN r, u.id as userId, u.name as userName
      ORDER BY r.priority DESC, r.createdAt ASC
    `;
        const result = await this.neo4j.read(query, { bookId });
        return result.records.map((r, index) => ({
            position: index + 1,
            reservationId: r.get("r").properties.id,
            userId: r.get("userId"),
            userName: r.get("userName"),
            priority: r.get("r").properties.priority,
            startDate: r.get("r").properties.startDate,
            endDate: r.get("r").properties.endDate,
        }));
    }
    async getUserReservations(userId) {
        const query = `
      MATCH (u:User { id: $userId })-[:RESERVED]->(r:Reservation)-[:OF_BOOK]->(b:Book)
      WHERE r.status = 'ACTIVE'
      RETURN r, b
      ORDER BY r.createdAt DESC
    `;
        const result = await this.neo4j.read(query, { userId });
        return result.records.map((r) => ({
            id: r.get("r").properties.id,
            book: {
                id: r.get("b").properties.id,
                title: r.get("b").properties.title,
                author: r.get("b").properties.author,
                isbn: r.get("b").properties.isbn,
                description: r.get("b").properties.description,
                publicationYear: r.get("b").properties.publicationYear,
                genre: r.get("b").properties.genre,
                coverImage: r.get("b").properties.coverImage ?? null,
            },
            startDate: r.get("r").properties.startDate,
            endDate: r.get("r").properties.endDate,
            priority: r.get("r").properties.priority,
            status: r.get("r").properties.status,
            durationDays: Math.ceil((new Date(r.get("r").properties.endDate).getTime() -
                new Date(r.get("r").properties.startDate).getTime()) /
                (1000 * 60 * 60 * 24)),
        }));
    }
    async getEarliestAvailableSlot(bookId) {
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
    calculatePriority(score) {
        if (score >= 300)
            return 5;
        if (score >= 200)
            return 4;
        if (score >= 150)
            return 3;
        if (score >= 100)
            return 2;
        return 1;
    }
};
exports.ReservationService = ReservationService;
exports.ReservationService = ReservationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [neo4j_service_1.Neo4jService,
        score_service_1.ScoreService])
], ReservationService);
