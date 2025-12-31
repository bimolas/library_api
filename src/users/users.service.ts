import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Neo4jService } from "../neo4j/neo4j.service";
import type { CreateUserDto } from "./dto/create-user.dto";
import { v4 as uuid } from "uuid";
import { CreateUserWithRoleDto } from "./dto/create-user-with-role.dto";
import * as bcrypt from "bcryptjs";
import { UpdateUserDto } from "./dto/uipdate-user.dto";
import { BanUserDto } from "./dto/ban-user.dto";
@Injectable()
export class UsersService {
  constructor(private neo4j: Neo4jService) {}

  async banUser(userId: string, dto: BanUserDto) {
    const { reason, days, until } = dto;

    const query = `
      MATCH (u:User { id: $userId })
      SET u.status = 'BANNED',
          u.banReason = $reason,
          u.banUntil = CASE
            WHEN $until IS NOT NULL THEN datetime($until)
            WHEN $days IS NOT NULL THEN datetime() + duration({ days: $days })
            ELSE datetime() + duration({ days: 7 })
          END
      RETURN u
    `;

    const params = {
      userId,
      reason: reason ?? null,
      days: days ?? null,
      until: until ?? null,
    };

    const result = await this.neo4j.write(query, params);

    if (!result.records || result.records.length === 0) {
      throw new NotFoundException("User not found");
    }

    const userNode = result.records[0].get("u");
    return this.mapNeo4jToUser(userNode);
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto) {
    const existingUser = await this.findById(id);
    if (!existingUser) {
      throw new BadRequestException("User not found");
    }
    const updates: string[] = [];
    const params: any = { id };

    if (updateUserDto.name) {
      updates.push("u.name = $name");
      params.name = updateUserDto.name;
    }
    if (updateUserDto.email) {
      updates.push("u.email = $email");
      params.email = updateUserDto.email;
    }
    if (updateUserDto.password) {
      const hashedPassword = await bcrypt.hash(updateUserDto.password, 10);
      updates.push("u.password = $password");
      params.password = hashedPassword;
    }
    if (updateUserDto.imageUrl) {
      updates.push("u.imageUrl = $imageUrl");
      params.imageUrl = updateUserDto.imageUrl;
    }
    if (updateUserDto.role) {
      updates.push("u.role = $role");
      params.role = updateUserDto.role;
    }

    if (updates.length === 0) {
      return existingUser;
    }

    const query = `
      MATCH (u:User { id: $id })
      SET ${updates.join(", ")}
      RETURN u
    `;
    const result = await this.neo4j.write(query, params);
    return this.mapNeo4jToUser(result.records[0].get("u"));
  }

  async create(createUserDto: CreateUserDto) {
    const id = uuid();
    const query = `
      CREATE (u:User {
        id: $id,
        email: $email,
        name: $name,
        password: $password,
        role: 'USER',
        createdAt: $createdAt,
        score: $score,
        status: $status,
        tier: 'BRONZE'
      })
      RETURN u
    `;

    const result = await this.neo4j.write(query, {
      id,
      email: createUserDto.email,
      name: createUserDto.name,
      password: createUserDto.password,
      createdAt: new Date().toISOString(),
      score: 0,
      status: "ACTIVE",
    });

    return this.mapNeo4jToUser(result.records[0].get("u"));
  }

  async createWithRole(createUserDto: any) {
    const existing = await this.findByEmail(createUserDto.email);
    if (existing) {
      throw new BadRequestException("Email already registered");
    }

    createUserDto.password = await bcrypt.hash(createUserDto.password, 10);
    const id = uuid();
    const query = `
      CREATE (u:User {
        id: $id,
        email: $email,
        name: $name,
        password: $password,
        role: $role,
        createdAt: $createdAt,
        score: $score,
        status: $status,
        tier: 'BRONZE'
      })
      RETURN u
    `;

    const result = await this.neo4j.write(query, {
      id,
      email: createUserDto.email,
      name: createUserDto.name,
      password: createUserDto.password,
      role: createUserDto.role,
      createdAt: new Date().toISOString(),
      score: 0,
      status: "ACTIVE",
    });

    return this.mapNeo4jToUser(result.records[0].get("u"));
  }

  async findByEmail(email: string) {
    const query = "MATCH (u:User { email: $email }) RETURN u";
    (this as any).mapNeo4jToUser = (node: any) => ({
      id: node.properties.id,
      email: node.properties.email,
      name: node.properties.name,
      role: node.properties.role,
      score: node.properties.score,
      tier: node.properties.tier,
      createdAt: node.properties.createdAt,
      password: node.properties.password,
      imageUrl: node.properties.imageUrl,
    });
    const result = await this.neo4j.read(query, { email });

    if (result.records.length === 0) return null;
    return this.mapNeo4jToUser(result.records[0].get("u"));
  }

  async findById(id: string) {
    const query = "MATCH (u:User { id: $id }) RETURN u";
    const result = await this.neo4j.read(query, { id });

    if (result.records.length === 0) return null;
    return this.mapNeo4jToUser(result.records[0].get("u"));
  }

  async getUserProfile(userId: string) {
    const query = `
      MATCH (u:User { id: $userId })
      OPTIONAL MATCH (u)-[b:BORROWED]->(borrow:Borrow)
      OPTIONAL MATCH (u)-[r:RESERVED]->(res:Reservation)
      RETURN u, 
        COUNT(DISTINCT b) as borrowCount,
        COUNT(DISTINCT r) as reservationCount
    `;

    const result = await this.neo4j.read(query, { userId });
    const user = result.records[0].get("u");

    return {
      ...this.mapNeo4jToUser(user),
      borrowCount: result.records[0].get("borrowCount").toNumber(),
      reservationCount: result.records[0].get("reservationCount").toNumber(),
    };
  }

  async getAllUsers(limit: number = 100, skip: number = 0) {
    const query = `
      MATCH (u:User)
      OPTIONAL MATCH (u)-[:BORROWED]->(borrow:Borrow)
      WITH u, collect(borrow) AS borrows, borrow
      RETURN u,
             COUNT(borrow) AS totalBorrows,
             SUM(CASE WHEN borrow.status = 'ACTIVE' THEN 1 ELSE 0 END) AS activeBorrows,
             SUM(CASE WHEN borrow.status = 'COMPLETED' THEN 1 ELSE 0 END) AS completedBorrows,
             SUM(
               CASE
                 WHEN borrow.status = 'COMPLETED' AND borrow.returnDate IS NOT NULL AND borrow.dueDate IS NOT NULL
                   AND (datetime(borrow.returnDate) <= datetime(borrow.dueDate))
                 THEN 1 ELSE 0
               END
             ) AS onTimeReturns,
             MAX(
               CASE
                 WHEN borrow.status = 'ACTIVE' AND borrow.borrowDate IS NOT NULL AND borrow.dueDate IS NOT NULL
                 THEN toInteger( (datetime(borrow.dueDate).epochMillis - datetime(borrow.borrowDate).epochMillis) / 86400000 )
                 ELSE NULL
               END
             ) AS maxActiveBorrowDays
      ORDER BY u.createdAt DESC
      SKIP $skip
      LIMIT $limit
    `;
    const result = await this.neo4j.read(query, { skip, limit });

    const toNum = (v: any) =>
      v && typeof v.toNumber === "function" ? v.toNumber() : Number(v) || 0;

    return result.records.map((r: any) => {
      const userNode = r.get("u");
      const totalBorrows = toNum(r.get("totalBorrows"));
      const activeBorrows = toNum(r.get("activeBorrows"));
      const completedBorrows = toNum(r.get("completedBorrows"));
      const onTimeReturns = toNum(r.get("onTimeReturns"));
      const maxActiveBorrowDays =
        r.get("maxActiveBorrowDays") === null
          ? 0
          : toNum(r.get("maxActiveBorrowDays"));

      const onTimeReturnPercent =
        completedBorrows > 0
          ? Math.round((onTimeReturns / completedBorrows) * 10000) / 100
          : 0;

      return {
        ...this.mapNeo4jToUser(userNode),
        totalBorrows,
        activeBorrows,
        completedBorrows,
        onTimeReturns,
        onTimeRate: onTimeReturnPercent,
        maxActiveBorrowDays, // number of days (integer) of the longest active borrow period (0 if none)
      };
    });
  }

  async updateScore(userId: string, newScore: number) {
    const query = `
      MATCH (u:User { id: $userId })
      SET u.score = $score,
          u.tier = CASE
            WHEN $score >= 300 THEN 'DIAMOND'
            WHEN $score >= 200 THEN 'GOLD'
            WHEN $score >= 150 THEN 'SILVER'
            ELSE 'BRONZE'
          END
      RETURN u
    `;

    const result = await this.neo4j.write(query, { userId, score: newScore });
    return this.mapNeo4jToUser(result.records[0].get("u"));
  }

  private mapNeo4jToUser(node: any) {
    const rawScore = node.properties?.score;
    let scoreNum = 0;
    if (rawScore === undefined || rawScore === null) {
      scoreNum = 0;
    } else if (typeof rawScore === "number") {
      scoreNum = rawScore;
    } else if (rawScore && typeof rawScore.toNumber === "function") {
      // Neo4j Integer object
      scoreNum = rawScore.toNumber();
    } else if (rawScore && typeof rawScore.low === "number") {
      // older integer-like object { low, high }
      scoreNum = rawScore.low;
    } else {
      const parsed = Number(rawScore);
      scoreNum = isNaN(parsed) ? 0 : parsed;
    }

    const createdAtRaw = node.properties?.createdAt;
    const createdAt =
      createdAtRaw && typeof createdAtRaw.toString === "function"
        ? new Date(createdAtRaw.toString())
        : createdAtRaw
          ? new Date(createdAtRaw)
          : null;
          
    const banUntilRaw = node.properties?.banUntil;
    const banUntil =
      banUntilRaw && typeof banUntilRaw.toString === "function"
        ? new Date(banUntilRaw.toString())
        : banUntilRaw
          ? new Date(banUntilRaw)
          : null;
    return {
      id: node.properties.id,
      email: node.properties.email,
      name: node.properties.name,
      role: node.properties.role,
      score: scoreNum,
      tier: node.properties.tier,
      imageUrl: node.properties.imageUrl ?? null,
      createdAt: createdAt,
      status: node?.properties?.status ?? "ACTIVE",
      banReason: node.properties.banReason ?? null,
      banUntil: banUntil,
    };
  }

  async deleteUser(id: string) {
    const query = `
      MATCH (u:User { id: $id })
      DETACH DELETE u
    `;
    await this.neo4j.write(query, { id });
    return { message: "User deleted successfully" };
  }
}
