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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const neo4j_service_1 = require("../neo4j/neo4j.service");
const uuid_1 = require("uuid");
let UsersService = class UsersService {
    constructor(neo4j) {
        this.neo4j = neo4j;
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
        createdAt: datetime(),
        score: 100,
        tier: 'BRONZE'
      })
      RETURN u
    `;
        const result = await this.neo4j.write(query, {
            id,
            email: createUserDto.email,
            name: createUserDto.name,
            password: createUserDto.password,
        });
        return this.mapNeo4jToUser(result.records[0].get("u"));
    }
    async findByEmail(email) {
        const query = "MATCH (u:User { email: $email }) RETURN u";
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
    async getAllUsers(limit = 20, skip = 0) {
        const query = `
      MATCH (u:User)
      RETURN u
      SKIP $skip
      LIMIT $limit
    `;
        const result = await this.neo4j.read(query, { skip, limit });
        return result.records.map((r) => this.mapNeo4jToUser(r.get("u")));
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
        return {
            id: node.properties.id,
            email: node.properties.email,
            name: node.properties.name,
            role: node.properties.role,
            score: node.properties.score,
            tier: node.properties.tier,
            createdAt: node.properties.createdAt,
        };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [neo4j_service_1.Neo4jService])
], UsersService);
