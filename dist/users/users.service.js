"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const neo4j_service_1 = require("../neo4j/neo4j.service");
const uuid_1 = require("uuid");
const bcrypt = __importStar(require("bcryptjs"));
let UsersService = class UsersService {
    constructor(neo4j) {
        this.neo4j = neo4j;
    }
    async unbanUser(id) {
        const query = `
      MATCH (u:User { id: $userId })
      SET u.status = 'ACTIVE',
          u.banReason = NULL,
          u.banUntil = NULL
      RETURN u
    `;
        const result = await this.neo4j.write(query, { userId: id });
        if (!result.records || result.records.length === 0) {
            throw new common_1.NotFoundException("User not found");
        }
        const userNode = result.records[0].get("u");
        return this.mapNeo4jToUser(userNode);
    }
    async banUser(userId, dto) {
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
            throw new common_1.NotFoundException("User not found");
        }
        const userNode = result.records[0].get("u");
        return this.mapNeo4jToUser(userNode);
    }
    async updateUser(id, updateUserDto) {
        const existingUser = await this.findById(id);
        if (!existingUser) {
            throw new common_1.BadRequestException("User not found");
        }
        const updates = [];
        const params = { id };
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
    async create(createUserDto) {
        const id = (0, uuid_1.v4)();
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
    async createWithRole(createUserDto) {
        const existing = await this.findByEmail(createUserDto.email);
        if (existing) {
            throw new common_1.BadRequestException("Email already registered");
        }
        createUserDto.password = await bcrypt.hash(createUserDto.password, 10);
        const id = (0, uuid_1.v4)();
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
    async findByEmail(email) {
        const query = "MATCH (u:User { email: $email }) RETURN u";
        this.mapNeo4jToUser = (node) => ({
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
        if (result.records.length === 0)
            return null;
        return this.mapNeo4jToUser(result.records[0].get("u"));
    }
    async findById(id) {
        const query = "MATCH (u:User { id: $id }) RETURN u";
        const result = await this.neo4j.read(query, { id });
        if (result.records.length === 0)
            return null;
        return this.mapNeo4jToUser(result.records[0].get("u"));
    }
    async getUserProfile(userId) {
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
    async getAllUsers(limit = 100, skip = 0) {
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
        const toNum = (v) => v && typeof v.toNumber === "function" ? v.toNumber() : Number(v) || 0;
        return result.records.map((r) => {
            const userNode = r.get("u");
            const totalBorrows = toNum(r.get("totalBorrows"));
            const activeBorrows = toNum(r.get("activeBorrows"));
            const completedBorrows = toNum(r.get("completedBorrows"));
            const onTimeReturns = toNum(r.get("onTimeReturns"));
            const maxActiveBorrowDays = r.get("maxActiveBorrowDays") === null
                ? 0
                : toNum(r.get("maxActiveBorrowDays"));
            const onTimeReturnPercent = completedBorrows > 0
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
    async updateScore(userId, newScore) {
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
    mapNeo4jToUser(node) {
        const rawScore = node.properties?.score;
        let scoreNum = 0;
        if (rawScore === undefined || rawScore === null) {
            scoreNum = 0;
        }
        else if (typeof rawScore === "number") {
            scoreNum = rawScore;
        }
        else if (rawScore && typeof rawScore.toNumber === "function") {
            // Neo4j Integer object
            scoreNum = rawScore.toNumber();
        }
        else if (rawScore && typeof rawScore.low === "number") {
            // older integer-like object { low, high }
            scoreNum = rawScore.low;
        }
        else {
            const parsed = Number(rawScore);
            scoreNum = isNaN(parsed) ? 0 : parsed;
        }
        const createdAtRaw = node.properties?.createdAt;
        const createdAt = createdAtRaw && typeof createdAtRaw.toString === "function"
            ? new Date(createdAtRaw.toString())
            : createdAtRaw
                ? new Date(createdAtRaw)
                : null;
        const banUntilRaw = node.properties?.banUntil;
        const banUntil = banUntilRaw && typeof banUntilRaw.toString === "function"
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
    async deleteUser(id) {
        const query = `
      MATCH (u:User { id: $id })
      DETACH DELETE u
    `;
        await this.neo4j.write(query, { id });
        return { message: "User deleted successfully" };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [neo4j_service_1.Neo4jService])
], UsersService);
