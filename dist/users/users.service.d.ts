import { Neo4jService } from "../neo4j/neo4j.service";
import type { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/uipdate-user.dto";
export declare class UsersService {
    private neo4j;
    constructor(neo4j: Neo4jService);
    updateUser(id: string, updateUserDto: UpdateUserDto): Promise<{
        id: any;
        email: any;
        name: any;
        role: any;
        score: any;
        tier: any;
        imageUrl: any;
        createdAt: any;
    }>;
    create(createUserDto: CreateUserDto): Promise<{
        id: any;
        email: any;
        name: any;
        role: any;
        score: any;
        tier: any;
        imageUrl: any;
        createdAt: any;
    }>;
    createWithRole(createUserDto: any): Promise<{
        id: any;
        email: any;
        name: any;
        role: any;
        score: any;
        tier: any;
        imageUrl: any;
        createdAt: any;
    }>;
    findByEmail(email: string): Promise<{
        id: any;
        email: any;
        name: any;
        role: any;
        score: any;
        tier: any;
        imageUrl: any;
        createdAt: any;
    } | null>;
    findById(id: string): Promise<{
        id: any;
        email: any;
        name: any;
        role: any;
        score: any;
        tier: any;
        imageUrl: any;
        createdAt: any;
    } | null>;
    getUserProfile(userId: string): Promise<{
        borrowCount: any;
        reservationCount: any;
        id: any;
        email: any;
        name: any;
        role: any;
        score: any;
        tier: any;
        imageUrl: any;
        createdAt: any;
    }>;
    getAllUsers(limit?: number, skip?: number): Promise<{
        id: any;
        email: any;
        name: any;
        role: any;
        score: any;
        tier: any;
        imageUrl: any;
        createdAt: any;
    }[]>;
    updateScore(userId: string, newScore: number): Promise<{
        id: any;
        email: any;
        name: any;
        role: any;
        score: any;
        tier: any;
        imageUrl: any;
        createdAt: any;
    }>;
    private mapNeo4jToUser;
}
