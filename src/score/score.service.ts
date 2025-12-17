import { Injectable } from "@nestjs/common";
import { Neo4jService } from "../neo4j/neo4j.service";
import { v4 as uuid } from "uuid";

export enum ScoreEventType {
  ON_TIME_RETURN = "ON_TIME_RETURN",
  LATE_RETURN = "LATE_RETURN",
  CANCELLATION = "CANCELLATION",
  GENRE_DIVERSITY = "GENRE_DIVERSITY",
  ACTIVITY_FREQUENCY = "ACTIVITY_FREQUENCY",
}

@Injectable()
export class ScoreService {
  private readonly scoreWeights = {
    [ScoreEventType.ON_TIME_RETURN]: 10,
    [ScoreEventType.LATE_RETURN]: -25,
    [ScoreEventType.CANCELLATION]: -5,
    [ScoreEventType.GENRE_DIVERSITY]: 5,
    [ScoreEventType.ACTIVITY_FREQUENCY]: 3,
  };

  constructor(private neo4j: Neo4jService) {}

  async recordScoreEvent(
    userId: string,
    eventType: ScoreEventType,
    amount?: number
  ) {
    const points = amount || this.scoreWeights[eventType];
    const eventId = uuid();

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

  async getUserScore(userId: string) {
    const query = `
      MATCH (u:User { id: $userId })
      OPTIONAL MATCH (u)-[:HAS_SCORE_EVENT]->(se:ScoreEvent)
      RETURN u.score as currentScore,
             u.tier as tier,
             COLLECT(se { id: se.id, type: se.type, points: se.points, createdAt: se.createdAt }) as events
      ORDER BY se.createdAt DESC
    `;

    const result = await this.neo4j.read(query, { userId });
    const record = result.records[0];

    return {
      currentScore: record.get("currentScore").toNumber(),
      tier: record.get("tier"),
      events: record.get("events"),
    };
  }

  async getPrivileges(userId: string) {
    const scoreData = await this.getUserScore(userId);
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

  private calculateMaxBorrows(score: number): number {
    if (score >= 300) return 10;
    if (score >= 200) return 8;
    if (score >= 150) return 6;
    if (score >= 100) return 5;
    return 3;
  }

  private calculateBorrowDuration(score: number): number {
    if (score >= 300) return 60;
    if (score >= 200) return 45;
    if (score >= 150) return 30;
    return 21;
  }

  private calculateVisibility(score: number): string {
    if (score >= 200) return "PREMIUM";
    if (score >= 100) return "STANDARD";
    return "LIMITED";
  }
}
