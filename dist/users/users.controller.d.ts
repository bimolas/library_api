import { UsersService } from "./users.service";
import { CreateUserWithRoleDto } from "./dto/create-user-with-role.dto";
import { UpdateUserDto } from "./dto/uipdate-user.dto";
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    getProfile(user: any): Promise<{
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
    getUserById(id: string): Promise<{
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
    getAllUsers(): Promise<{
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
    createUser(createUserDto: CreateUserWithRoleDto): Promise<{
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
    updateUser(id: string, updateUserDto: UpdateUserDto, file: any): Promise<{
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
    deleteUser(id: string): Promise<{
        message: string;
    }>;
}
