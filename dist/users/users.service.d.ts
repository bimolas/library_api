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
        score: number;
        tier: any;
        imageUrl: any;
        createdAt: Date;
        status: any;
    }>;
    create(createUserDto: CreateUserDto): Promise<{
        id: any;
        email: any;
        name: any;
        role: any;
        score: number;
        tier: any;
        imageUrl: any;
        createdAt: Date;
        status: any;
    }>;
    createWithRole(createUserDto: any): Promise<{
        id: any;
        email: any;
        name: any;
        role: any;
        score: number;
        tier: any;
        imageUrl: any;
        createdAt: Date;
        status: any;
    }>;
    findByEmail(email: string): Promise<{
        id: any;
        email: any;
        name: any;
        role: any;
        score: number;
        tier: any;
        imageUrl: any;
        createdAt: Date;
        status: any;
    } | null>;
    findById(id: string): Promise<{
        id: any;
        email: any;
        name: any;
        role: any;
        score: number;
        tier: any;
        imageUrl: any;
        createdAt: Date;
        status: any;
    } | null>;
    getUserProfile(userId: string): Promise<{
        borrowCount: any;
        reservationCount: any;
        id: any;
        email: any;
        name: any;
        role: any;
        score: number;
        tier: any;
        imageUrl: any;
        createdAt: Date;
        status: any;
    }>;
    getAllUsers(limit?: number, skip?: number): Promise<{
        totalBorrows: any;
        activeBorrows: any;
        completedBorrows: any;
        onTimeReturns: any;
        onTimeRate: number;
        maxActiveBorrowDays: any;
        id: any;
        email: any;
        name: any;
        role: any;
        score: number;
        tier: any;
        imageUrl: any;
        createdAt: Date;
        status: any;
    }[]>;
    updateScore(userId: string, newScore: number): Promise<{
        id: any;
        email: any;
        name: any;
        role: any;
        score: number;
        tier: any;
        imageUrl: any;
        createdAt: Date;
        status: any;
    }>;
    private mapNeo4jToUser;
    deleteUser(id: string): Promise<{
        message: string;
    }>;
}
