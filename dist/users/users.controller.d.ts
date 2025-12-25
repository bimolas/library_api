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
        score: any;
        tier: any;
        imageUrl: any;
        createdAt: any;
    }>;
    getUserById(id: string): Promise<{
        id: any;
        email: any;
        name: any;
        role: any;
        score: any;
        tier: any;
        imageUrl: any;
        createdAt: any;
    } | null>;
    getAllUsers(): Promise<{
        id: any;
        email: any;
        name: any;
        role: any;
        score: any;
        tier: any;
        imageUrl: any;
        createdAt: any;
    }[]>;
    createUser(createUserDto: CreateUserWithRoleDto): Promise<{
        id: any;
        email: any;
        name: any;
        role: any;
        score: any;
        tier: any;
        imageUrl: any;
        createdAt: any;
    }>;
    updateUser(id: string, updateUserDto: UpdateUserDto, file: any): Promise<{
        id: any;
        email: any;
        name: any;
        role: any;
        score: any;
        tier: any;
        imageUrl: any;
        createdAt: any;
    }>;
}
