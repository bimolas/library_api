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

     await this.neo4j.write(
      `
      MATCH (bk:Book)-[:HAS_COPY]->(bc:BookCopy { id: $copyId })
      MATCH (bk)-[:BELONGS_TO]->(g:Genre)
      SET g.score = coalesce(g.score, 0) + 10
      RETURN g
      `,
      { copyId: selectedCopyId }
    );


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
        author: r.get("book").properties.author,
        coverImage: r.get("book").properties.coverImage ?? null,
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

async getLatestBorrowsByNearbyScores(userId: string, tolerance = 10, limit = 10) {
    const scoreQuery = `MATCH (u:User { id: $userId }) RETURN u.score AS score`;
    const scoreRes = await this.neo4j.read(scoreQuery, { userId });
    if (!scoreRes.records || scoreRes.records.length === 0) return [];

    const rawScore = scoreRes.records[0].get("score");
    const toNumber = (v: any) =>
      v && typeof v.toNumber === "function" ? v.toNumber() : v !== undefined && v !== null ? Number(v) : 0;
    const userScore = toNumber(rawScore);

    const query = `
      MATCH (other:User)
      WHERE other.id <> $userId AND abs(toFloat(other.score) - $userScore) <= $tolerance
      OPTIONAL MATCH (other)-[:BORROWED]->(br:Borrow)-[:OF_COPY]->(bc:BookCopy)<-[:HAS_COPY]-(book:Book)
      WITH other, br, book
      ORDER BY datetime(br.borrowDate) DESC
      WITH other, head(collect(br)) AS lastBorrow, head(collect(book)) AS lastBook
      WHERE lastBorrow IS NOT NULL
      OPTIONAL MATCH (lastBook)<-[:ON]-(rev:Review)
      WITH other, lastBorrow, lastBook, AVG(rev.rating) AS avgRating, COUNT(DISTINCT rev) AS reviewCount
      RETURN other { .id, .name, .email, .score, .tier } AS user,
             lastBorrow { .id, .borrowDate, .dueDate, .returnDate, .status } AS borrow,
             lastBook { .id, .title, .author } AS book,
             avgRating,
             reviewCount
      ORDER BY datetime(lastBorrow.borrowDate) DESC
      LIMIT $limit
    `;

    const result = await this.neo4j.read(query, {
      userId,
      userScore,
      tolerance,
      limit,
    });

    return result.records.map((r: any) => {
      const u = r.get("user") || {};
      const b = r.get("borrow") || {};
      const bk = r.get("book") || {};
      const rawAvg = r.get("avgRating");
      const rawReviewCount = r.get("reviewCount");

      const toStrDate = (v: any) => (v && typeof v.toString === "function" ? v.toString() : v ?? null);
      const scoreVal = u.score && typeof u.score.toNumber === "function" ? u.score.toNumber() : Number(u.score) || 0;
      const avgRating =
        rawAvg === null || rawAvg === undefined
          ? null
          : typeof rawAvg.toNumber === "function"
          ? Math.round(rawAvg.toNumber() * 100) / 100
          : Math.round(Number(rawAvg) * 100) / 100;
      const reviewCount =
        rawReviewCount && typeof rawReviewCount.toNumber === "function"
          ? rawReviewCount.toNumber()
          : Number(rawReviewCount) || 0;

      return {
        user: {
          id: u.id ?? null,
          name: u.name ?? null,
          email: u.email ?? null,
          score: scoreVal,
          tier: u.tier ?? null,
        },
        borrow: {
          id: b.id ?? null,
          borrowDate: toStrDate(b.borrowDate),
          dueDate: toStrDate(b.dueDate),
          returnDate: toStrDate(b.returnDate),
          status: b.status ?? null,
        },
        book: {
          id: bk.id ?? null,
          title: bk.title ?? null,
          author: bk.author ?? null,
          rating: avgRating,
          reviewCount,
        },
      };
    });
  }

  async getMonthlyBorrowStatsLastMonths(months = 6) {
    // returns last `months` months including current month (ordered oldest -> newest)
    const query = `
      UNWIND range(0, $months - 1) AS off
      WITH datetime() - duration({ months: off }) AS d
      WITH d.year AS year, d.month AS monthNum
      WITH year, monthNum
      CALL {
        WITH year, monthNum
        MATCH (br:Borrow)
        WHERE br.borrowDate IS NOT NULL
          AND datetime(br.borrowDate).year = year
          AND datetime(br.borrowDate).month = monthNum
        WITH collect(br) AS bs
        RETURN
          size(bs) AS borrows,
          size([b IN bs WHERE b.returnDate IS NOT NULL]) AS returns,
          size([b IN bs WHERE b.dueDate IS NOT NULL AND (
            (b.returnDate IS NOT NULL AND datetime(b.returnDate) > datetime(b.dueDate))
            OR (b.returnDate IS NULL AND datetime() > datetime(b.dueDate))
          )]) AS late
      }
      RETURN year, monthNum,
        CASE monthNum
          WHEN 1 THEN 'Jan' WHEN 2 THEN 'Feb' WHEN 3 THEN 'Mar' WHEN 4 THEN 'Apr'
          WHEN 5 THEN 'May' WHEN 6 THEN 'Jun' WHEN 7 THEN 'Jul' WHEN 8 THEN 'Aug'
          WHEN 9 THEN 'Sep' WHEN 10 THEN 'Oct' WHEN 11 THEN 'Nov' WHEN 12 THEN 'Dec'
        END AS month,
        borrows, returns, late
      ORDER BY year, monthNum
    `;

    const result = await this.neo4j.read(query, { months });

    if (!result.records) return [];

    const toNum = (v: any) =>
      v && typeof v.toNumber === "function" ? v.toNumber() : v !== undefined && v !== null ? Number(v) : 0;

    return result.records.map((rec: any) => ({
      month: rec.get("month"),
      year: toNum(rec.get("year")),
      borrows: toNum(rec.get("borrows")),
      returns: toNum(rec.get("returns")),
      late: toNum(rec.get("late")),
    }));
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
