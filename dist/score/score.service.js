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
exports.ScoreService = exports.ScoreEventType = void 0;
const common_1 = require("@nestjs/common");
const neo4j_service_1 = require("../neo4j/neo4j.service");
const uuid_1 = require("uuid");
var ScoreEventType;
(function (ScoreEventType) {
    ScoreEventType["ON_TIME_RETURN"] = "ON_TIME_RETURN";
    ScoreEventType["LATE_RETURN"] = "LATE_RETURN";
    ScoreEventType["CANCELLATION"] = "CANCELLATION";
    ScoreEventType["GENRE_DIVERSITY"] = "GENRE_DIVERSITY";
    ScoreEventType["ACTIVITY_FREQUENCY"] = "ACTIVITY_FREQUENCY";
})(ScoreEventType || (exports.ScoreEventType = ScoreEventType = {}));
let ScoreService = class ScoreService {
    constructor(neo4j) {
        this.neo4j = neo4j;
        this.scoreWeights = {
            [ScoreEventType.ON_TIME_RETURN]: 10,
            [ScoreEventType.LATE_RETURN]: -25,
            [ScoreEventType.CANCELLATION]: -5,
            [ScoreEventType.GENRE_DIVERSITY]: 5,
            [ScoreEventType.ACTIVITY_FREQUENCY]: 3,
        };
    }
    async recordScoreEvent(userId, eventType, amount) {
        const points = amount || this.scoreWeights[eventType];
        const eventId = (0, uuid_1.v4)();
        const query = `
      MATCH (u:User { id: $userId })
      CREATE (se:ScoreEvent {
        id: $eventId,
        type: $type,
        points: $points,
        createdAt: datetime()
      })
      CREATE (u)-[:HAS_SCORE_EVENT]->(se)
      SET u.score = u.score + $points
      RETURN u, se
    `;
        await this.neo4j.write(query, {
            userId,
            eventId,
            type: eventType,
            points,
        });
    }
    async getUserScore(userId) {
        const query = `
      MATCH (u:User { id: $userId })
      OPTIONAL MATCH (u)-[:HAS_SCORE_EVENT]->(se:ScoreEvent)
      WITH u, se
      ORDER BY se.createdAt DESC
      WITH u, COLLECT(se { id: se.id, type: se.type, points: se.points, createdAt: se.createdAt }) AS events
      RETURN u.score AS currentScore, u.tier AS tier, events
    `;
        const result = await this.neo4j.read(query, { userId });
        const record = result.records[0];
        console.log("🚀 ~ ScoreService ~ getUserScore ~ record:", record);
        const rawScore = record.get("currentScore");
        const currentScore = rawScore && typeof rawScore.toNumber === "function"
            ? rawScore.toNumber()
            : Number(rawScore) || 0;
        const rawEvents = record.get("events") || [];
        const events = Array.isArray(rawEvents)
            ? rawEvents.map((ev) => ({
                id: ev.id,
                type: ev.type,
                points: ev && ev.points && typeof ev.points.toNumber === "function"
                    ? ev.points.toNumber()
                    : ev.points,
                createdAt: ev && ev.createdAt && typeof ev.createdAt.toString === "function"
                    ? ev.createdAt.toString()
                    : ev && ev.createdAt
            }))
            : [];
        return {
            currentScore,
            tier: record.get("tier"),
            events,
        };
    }
    async getPrivileges(userId) {
        const scoreData = await this.getUserScore(userId);
        console.log("🚀 ~ ScoreService ~ getPrivileges ~ userId:", userId);
        const score = scoreData.currentScore;
        return {
            maxConcurrentBorrows: this.calculateMaxBorrows(score),
            borrowDuration: this.calculateBorrowDuration(score),
            canReserve: score >= 50,
            canOverrideReservation: score >= 200,
            earlyAccessToReturns: score >= 150,
            visibilityLevel: this.calculateVisibility(score),
        };
    }
    calculateMaxBorrows(score) {
        if (score >= 300)
            return 10;
        if (score >= 200)
            return 8;
        if (score >= 150)
            return 6;
        if (score >= 100)
            return 5;
        return 3;
    }
    calculateBorrowDuration(score) {
        if (score >= 300)
            return 60;
        if (score >= 200)
            return 45;
        if (score >= 150)
            return 30;
        return 21;
    }
    calculateVisibility(score) {
        if (score >= 200)
            return "PREMIUM";
        if (score >= 100)
            return "STANDARD";
        return "LIMITED";
    }
};
exports.ScoreService = ScoreService;
exports.ScoreService = ScoreService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [neo4j_service_1.Neo4jService])
], ScoreService);
