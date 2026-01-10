import { Injectable } from "@nestjs/common";
import { Neo4jService } from "../neo4j/neo4j.service";

@Injectable()
export class AnalyticsService {
 
  constructor(private neo4j: Neo4jService) {}
async getPlatformSummary() {
    const query = `
      CALL {
        MATCH (b:Borrow) WHERE b.status = 'ACTIVE' RETURN count(b) AS totalActiveBorrows
      }
      CALL {
        MATCH (r:Reservation) WHERE r.status = 'ACTIVE' RETURN count(r) AS totalActiveReservations
      }
      CALL {
        MATCH (u:User) RETURN count(u) AS totalUsers
      }
      CALL {
        MATCH (cb:Borrow)
        WHERE cb.borrowDate IS NOT NULL
        RETURN avg(
          toFloat(
            CASE
              WHEN cb.status = 'COMPLETED' AND cb.returnDate IS NOT NULL
                THEN datetime(cb.returnDate).epochMillis - datetime(cb.borrowDate).epochMillis
              ELSE datetime().epochMillis - datetime(cb.borrowDate).epochMillis
            END
          ) / 86400000.0
        ) AS avgBorrowDays
      }
      RETURN {
        totalActiveBorrows: totalActiveBorrows,
        totalActiveReservations: totalActiveReservations,
        totalUsers: totalUsers,
        avgBorrowDays: avgBorrowDays
      } AS summary
    `;

    const result = await this.neo4j.read(query);

    if (!result.records || result.records.length === 0) {
      return {
        totalActiveBorrows: 0,
        totalActiveReservations: 0,
        totalUsers: 0,
        avgBorrowDays: 0,
      };
    }

    const raw = result.records[0].get("summary");

    const toNumber = (v: any) =>
      v && typeof v.toNumber === "function"
        ? v.toNumber()
        : v !== undefined && v !== null
          ? Number(v)
          : 0;

    const totalActiveBorrows =
      raw.totalActiveBorrows && typeof raw.totalActiveBorrows.toNumber === "function"
        ? raw.totalActiveBorrows.toNumber()
        : Number(raw.totalActiveBorrows) || 0;

    const totalActiveReservations =
      raw.totalActiveReservations &&
      typeof raw.totalActiveReservations.toNumber === "function"
        ? raw.totalActiveReservations.toNumber()
        : Number(raw.totalActiveReservations) || 0;

    const totalUsers =
      raw.totalUsers && typeof raw.totalUsers.toNumber === "function"
        ? raw.totalUsers.toNumber()
        : Number(raw.totalUsers) || 0;

    const rawAvg = raw.avgBorrowDays;
    const avgBorrowDays =
      rawAvg === null || rawAvg === undefined
        ? 0
        : typeof rawAvg.toNumber === "function"
          ? Math.round(rawAvg.toNumber() * 100) / 100
          : Math.round(Number(rawAvg) * 100) / 100;

    return {
      totalActiveBorrows,
      totalActiveReservations,
      totalUsers,
      avgBorrowDays,
    };
  }

 // ...existing code...
  async getBookAvailability(id: string) {
    const query = `
      MATCH (book:Book { id: $id })
      OPTIONAL MATCH (book)-[:HAS_COPY]->(bc:BookCopy)
      WITH book, COLLECT(bc) AS copies

      OPTIONAL MATCH (userBorrow:User)-[:BORROWED]->(br:Borrow)-[:OF_COPY]->(:BookCopy)<-[:HAS_COPY]-(book)
      WHERE br.status = 'ACTIVE'
      WITH book, copies, COLLECT(DISTINCT {
        id: br.id,
        userId: userBorrow.id,
        userName: userBorrow.name,
        borrowDate: br.borrowDate,
        dueDate: br.dueDate,
        status: br.status
      }) AS borrows

      OPTIONAL MATCH (userRes:User)-[:RESERVED]->(res:Reservation)-[:OF_BOOK]->(book)
      WHERE res.status = 'ACTIVE'
      WITH book, copies, borrows, COLLECT(DISTINCT {
        id: res.id,
        userId: userRes.id,
        userName: userRes.name,
        reservedAt: res.createdAt,
        status: res.status,
        endDate: res.endDate
      }) AS reservations

      RETURN book { .id, .title, .author, .description, .publicationYear } AS book,
             size(copies) AS totalCopies,
             size([c IN copies WHERE c.status = 'AVAILABLE']) AS availableCopies,
             borrows,
             reservations
    `;

    const result = await this.neo4j.read(query, { id });
    if (!result.records || result.records.length === 0) return null;

    const rec = result.records[0];
    const raw = rec.get("book") || {};
    const rawTotal = rec.get("totalCopies");
    const rawAvailable = rec.get("availableCopies");
    const rawBorrows = rec.get("borrows") || [];
    const rawReservations = rec.get("reservations") || [];

    const toNumber = (v: any) =>
      v && typeof v.toNumber === "function" ? v.toNumber() : v !== undefined && v !== null ? Number(v) : 0;

    const toStringDate = (v: any) =>
      v && typeof v.toString === "function" ? v.toString() : v ?? null;

    const totalCopies =
      rawTotal && typeof rawTotal.toNumber === "function" ? rawTotal.toNumber() : Number(rawTotal) || 0;
    const availableCopies =
      rawAvailable && typeof rawAvailable.toNumber === "function"
        ? rawAvailable.toNumber()
        : Number(rawAvailable) || 0;

    const borrows = Array.isArray(rawBorrows)
      ? rawBorrows.map((b: any) => ({
          id: b.id ?? null,
          userId: b.userId ?? null,
          userName: b.userName ?? null,
          borrowDate: toStringDate(b.borrowDate),
          dueDate: toStringDate(b.dueDate),
          status: b.status ?? null,
        }))
      : [];

    const reservations = Array.isArray(rawReservations)
      ? rawReservations.map((r: any) => ({
          id: r.id ?? null,
          userId: r.userId ?? null,
          userName: r.userName ?? null,
          reservedAt: toStringDate(r.reservedAt),
          endDate: toStringDate(r.endDate),
          status: r.status ?? null,
        }))
      : [];

    return {
      id: raw.id,
      title: raw.title,
      author: raw.author,
      description: raw.description,
      publicationYear: raw.publicationYear,
      totalCopies,
      availableCopies,
      borrows,       // only ACTIVE borrows
      reservations,  // only ACTIVE reservations
    };
  }
// ...existing code...

  async getUserAnalytics(userId: string) {
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
           u.name AS name,
           u.email AS email,
           u.status AS status,
           u.imageUrl AS imageUrl,
           (CASE WHEN u.name IS NOT NULL THEN 1 ELSE 0 END +
            CASE WHEN u.email IS NOT NULL THEN 1 ELSE 0 END +
            CASE WHEN u.imageUrl IS NOT NULL THEN 1 ELSE 0 END) AS filledFields,
           COUNT(DISTINCT b) AS borrowCount,
           COUNT(DISTINCT r) AS reservationCount,
           COUNT(DISTINCT rev) AS reviewCount,
           COLLECT(DISTINCT g.name) AS genresRead,
           COUNT(DISTINCT se) AS totalScoreEvents
      WITH u, currentScore, tier, createdAt, name, email, status, imageUrl, borrowCount, reservationCount, reviewCount, genresRead, totalScoreEvents, filledFields,
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
        progress: progress,
        name: name,
        email: email,
        status: status,
        imageUrl: imageUrl
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
        name: null,
        email: null,
        status: null,
        imageUrl: null,
      };
    }

    const raw = result.records[0].get("analytics");

    const toNumber = (v: any) =>
      v && typeof v.toNumber === "function" ? v.toNumber() : Number(v) || 0;

    const toStringDate = (v: any) =>
      v && typeof v.toString === "function" ? v.toString() : (v ?? null);

    return {
      borrowCount:
        raw.borrowCount && typeof raw.borrowCount.toNumber === "function"
          ? raw.borrowCount.toNumber()
          : Number(raw.borrowCount) || 0,
      reservationCount:
        raw.reservationCount &&
        typeof raw.reservationCount.toNumber === "function"
          ? raw.reservationCount.toNumber()
          : Number(raw.reservationCount) || 0,
      reviewCount:
        raw.reviewCount && typeof raw.reviewCount.toNumber === "function"
          ? raw.reviewCount.toNumber()
          : Number(raw.reviewCount) || 0,
      genresRead: raw.genresRead || [],
      totalScoreEvents:
        raw.totalScoreEvents &&
        typeof raw.totalScoreEvents.toNumber === "function"
          ? raw.totalScoreEvents.toNumber()
          : Number(raw.totalScoreEvents) || 0,
      currentScore:
        raw.currentScore && typeof raw.currentScore.toNumber === "function"
          ? raw.currentScore.toNumber()
          : (raw.currentScore ?? 0),
      tier: raw.tier ?? null,
      createdAt: toStringDate(raw.createdAt),
      progress:
        raw.progress && typeof raw.progress.toNumber === "function"
          ? raw.progress.toNumber()
          : Number(raw.progress) || 0,
      // new user info
      name: raw.name ?? null,
      email: raw.email ?? null,
      status: raw.status ?? "ACTIVE",
      imageUrl: raw.imageUrl ?? null,
    };
  }

  async getTrendingBooks(limit = 10) {
    const query = `
      MATCH (book:Book)-[:HAS_COPY]->(bc:BookCopy)
      OPTIONAL MATCH (bc)<-[:OF_COPY]-(br:Borrow)
      OPTIONAL MATCH (book)<-[:ON]-(rev:Review)<-[:REVIEWED]-(u:User)
      OPTIONAL MATCH (book)-[:BELONGS_TO]->(g:Genre)
      WITH book,
           COUNT(DISTINCT br) AS borrowCount,            // number of times this book was borrowed
           AVG(rev.rating) AS avgRating,
           COUNT(DISTINCT u.id) AS reviewCount,         // number of distinct users who reviewed the book
           head(COLLECT(DISTINCT g.name)) AS genre
      RETURN {
        id: book.id,
        title: book.title,
        author: book.author,
        borrowCount: borrowCount,
        avgRating: avgRating,
        reviewCount: reviewCount,
        genre: genre,
        coverImage: book.coverImage
      } AS bookStats
      ORDER BY borrowCount DESC
      LIMIT $limit
    `;

    const result = await this.neo4j.read(query, { limit });

    return result.records.map((rec: any) => {
      const s = rec.get("bookStats") || {};
      const rawBorrow = s.borrowCount;
      const rawReviewCount = s.reviewCount;
      const rawAvg = s.avgRating;
      const genre = s.genre ?? null;

      return {
        id: s.id,
        title: s.title,
        author: s.author,
        borrowCount:
          rawBorrow && typeof rawBorrow.toNumber === "function"
            ? rawBorrow.toNumber()
            : Number(rawBorrow) || 0,
        avgRating:
          rawAvg === null || rawAvg === undefined
            ? null
            : typeof rawAvg.toNumber === "function"
              ? rawAvg.toNumber()
              : Number(rawAvg),
        reviewCount:
          rawReviewCount && typeof rawReviewCount.toNumber === "function"
            ? rawReviewCount.toNumber()
            : Number(rawReviewCount) || 0,
        genre,
        coverImage: s.coverImage ?? null,
      };
    });
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
      MATCH (user:User { id: $userId })-[:BORROWED]->(b:Borrow)-[:OF_COPY]->(bc:BookCopy)<-[:HAS_COPY]-(book:Book)-[:BELONGS_TO]->(g:Genre)
      OPTIONAL MATCH (user)-[:REVIEWED]->(rev:Review)-[:ON]->(book)
      WITH g.name AS genre, COUNT(DISTINCT b) AS borrowCount, g.score AS totalScore
      RETURN genre, borrowCount AS count, totalScore
      ORDER BY count DESC
    `;

    const result = await this.neo4j.read(query, { userId });

    return result.records.map((r: any) => {
      const rawCount = r.get("count");
      const count =
        rawCount && typeof rawCount.toNumber === "function"
          ? rawCount.toNumber()
          : Number(rawCount) || 0;

      const rawTotal = r.get("totalScore");
      const totalScore =
        rawTotal && typeof rawTotal.toNumber === "function"
          ? rawTotal.toNumber()
          : rawTotal !== undefined && rawTotal !== null
            ? Number(rawTotal)
            : 0;

      return {
        genre: r.get("genre"),
        count,
        score: totalScore === 0 ? 5 : totalScore,
      };
    });
  }

  async getGenreDistributionAll() {
    const query = `
      MATCH (:User)-[:BORROWED]->(br:Borrow)-[:OF_COPY]->(:BookCopy)<-[:HAS_COPY]-(book:Book)-[:BELONGS_TO]->(g:Genre)
      OPTIONAL MATCH (book)<-[:ON]-(rev:Review)
      WITH g.name AS genre, COUNT(DISTINCT br) AS borrowCount, AVG(rev.rating) AS avgRating
      RETURN genre, borrowCount AS count, avgRating
      ORDER BY count DESC
    `;

    const result = await this.neo4j.read(query);
    if (!result.records) return [];

    return result.records.map((r: any) => {
      const rawCount = r.get("count");
      const count =
        rawCount && typeof rawCount.toNumber === "function"
          ? rawCount.toNumber()
          : Number(rawCount) || 0;

      const rawAvg = r.get("avgRating");
      const avgRating =
        rawAvg === null || rawAvg === undefined
          ? null
          : typeof rawAvg.toNumber === "function"
          ? Math.round(rawAvg.toNumber() * 100) / 100
          : Math.round(Number(rawAvg) * 100) / 100;

      return {
        genre: r.get("genre"),
        count,
        avgRating,
      };
    });
  }

  async getRecommendations(userId: string, limit = 10) {
    const query = `
      MATCH (u:User { id: $userId })
      OPTIONAL MATCH (u)-[:BORROWED]->(:Borrow)-[:OF_COPY]->(:BookCopy)<-[:HAS_COPY]-(ub:Book)
      WITH COLLECT(DISTINCT ub.id) AS userBookIds

      MATCH (u2:User { id: $userId })-[:BORROWED]->(:Borrow)-[:OF_COPY]->(:BookCopy)<-[:HAS_COPY]-(b)-[:BELONGS_TO]->(g:Genre)
      WITH userBookIds, g.name AS genreName, COUNT(*) AS genreCount
      ORDER BY genreCount DESC
      LIMIT 3
      WITH userBookIds, COLLECT(genreName) AS topGenres

      MATCH (candidate:Book)-[:BELONGS_TO]->(g2:Genre)
      WHERE g2.name IN topGenres AND NOT candidate.id IN userBookIds

      OPTIONAL MATCH (candidate)-[:HAS_COPY]->(bc:BookCopy)
      OPTIONAL MATCH (bc)<-[:OF_COPY]-(brAll:Borrow)
      OPTIONAL MATCH (bc)<-[:OF_COPY]-(brActive:Borrow { status: 'ACTIVE' })
      OPTIONAL MATCH (candidate)<-[:OF_BOOK]-(res:Reservation { status: 'ACTIVE' })
      OPTIONAL MATCH (candidate)<-[:ON]-(rev:Review)

      WITH candidate, g2, brAll, bc, brActive, res, rev

      WITH candidate.title AS titleKey,
           candidate,
           COLLECT(DISTINCT g2.name) AS genres,
           COUNT(DISTINCT brAll) AS popularity,
           COUNT(DISTINCT bc) AS totalCopies,
           COUNT(DISTINCT brActive) AS borrowedCopies,
           COUNT(DISTINCT res) AS activeReservations,
           AVG(rev.rating) AS avgRating

      // group by titleKey to avoid returning duplicate books with same title
      WITH titleKey, head(collect(candidate)) AS bookNode, genres, popularity, totalCopies, borrowedCopies, activeReservations, avgRating

      RETURN bookNode { .id, .title, .author, .description, .publicationYear, .coverImage } AS book,
             genres,
             popularity,
             totalCopies,
             (totalCopies - borrowedCopies) AS availableCopies,
             avgRating,
             CASE WHEN totalCopies > 0 THEN ROUND((toFloat(borrowedCopies) + toFloat(activeReservations)) / toFloat(totalCopies) * 100.0, 2) ELSE 0 END AS demandPressure
      ORDER BY popularity DESC
      LIMIT $limit
    `;

    const result = await this.neo4j.read(query, { userId, limit });

    if (!result.records || result.records.length === 0) return [];

    return result.records.map((rec: any) => {
      const bookObj = rec.get("book") || {};
      const rawPopularity = rec.get("popularity");
      const rawTotalCopies = rec.get("totalCopies");
      const rawAvailable = rec.get("availableCopies");
      const rawAvg = rec.get("avgRating");
      const rawDemand = rec.get("demandPressure");
      const genres = rec.get("genres") || [];

      const popularity =
        rawPopularity && typeof rawPopularity.toNumber === "function"
          ? rawPopularity.toNumber()
          : Number(rawPopularity) || 0;

      const totalCopies =
        rawTotalCopies && typeof rawTotalCopies.toNumber === "function"
          ? rawTotalCopies.toNumber()
          : Number(rawTotalCopies) || 0;

      const availableCopies =
        rawAvailable && typeof rawAvailable.toNumber === "function"
          ? rawAvailable.toNumber()
          : Number(rawAvailable) || 0;

      const avgRating =
        rawAvg === null || rawAvg === undefined
          ? null
          : typeof rawAvg.toNumber === "function"
            ? rawAvg.toNumber()
            : Number(rawAvg);

      const demandPressure =
        rawDemand === null || rawDemand === undefined
          ? 0
          : typeof rawDemand.toNumber === "function"
            ? rawDemand.toNumber()
            : Number(rawDemand);

      return {
        id: bookObj.id,
        title: bookObj.title,
        author: bookObj.author,
        description: bookObj.description,
        publicationYear: bookObj.publicationYear,
        coverImage: bookObj.coverImage ?? null,
        genres, // array of genre names (usually one)
        genre: Array.isArray(genres) && genres.length > 0 ? genres[0] : null,
        popularity,
        totalCopies,
        availableCopies,
        rating: avgRating,
        demandPressure, // percentage (0-100) rounded to 2 decimals
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
      return {
        totalLateReturns: 0,
        averageLateDays: null,
        maxLateDays: null,
        lateReturnRate: 0,
      };
    return result.records[0].get("stats");
  }
}
