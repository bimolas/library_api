import { JwtService } from "@nestjs/jwt";
import { UsersService } from "../users/users.service";
import type { SignUpDto } from "./dto/sign-up.dto";
import type { SignInDto } from "./dto/sign-in.dto";
import type { AuthPayload } from "./dto/auth-payload.dto";
export declare class AuthService {
    private usersService;
    private jwtService;
    constructor(usersService: UsersService, jwtService: JwtService);
    signUp(signUpDto: SignUpDto): Promise<AuthPayload>;
    signIn(signInDto: SignInDto): Promise<AuthPayload>;
    refreshToken(refreshToken: string): Promise<AuthPayload>;
    private generateTokens;
}
