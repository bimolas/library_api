import { BadRequestException, Injectable } from "@nestjs/common";
import { Neo4jService } from "../neo4j/neo4j.service";
import type { CreateUserDto } from "./dto/create-user.dto";
import { v4 as uuid } from "uuid";
import { CreateUserWithRoleDto } from "./dto/create-user-with-role.dto";
import * as bcrypt from "bcryptjs";
import { UpdateUserDto } from "./dto/uipdate-user.dto";
@Injectable()
export class UsersService {
 
  constructor(private neo4j: Neo4jService) {}


   async updateUser(id:string, updateUserDto: UpdateUserDto) {
    console.log(
      "🚀 ~ UsersService ~ updateUser ~ updateUserDto:",
      updateUserDto
    );
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
      role: createUserDto.role,
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

  async getAllUsers(limit: number = 10, skip: number = 0) {
    const query = `
      MATCH (u:User)
      RETURN u
      SKIP $skip
      LIMIT $limit
    `;
    const result = await this.neo4j.read(query, { skip, limit });
    return result.records.map((r: any) => this.mapNeo4jToUser(r.get("u")));
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
    console.log(
      "🚀 ~ UsersService ~ mapNeo4jToUser ~ node:",
      node
    );
    return {
      id: node.properties.id,
      email: node.properties.email,
      name: node.properties.name,
      role: node.properties.role,
      score: node.properties.score,
      tier: node.properties.tier,
      imageUrl: node.properties.imageUrl,
      createdAt: node.properties.createdAt,
    };
  }
}
