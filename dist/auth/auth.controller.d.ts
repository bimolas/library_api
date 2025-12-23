import { AuthService } from "./auth.service";
import { SignUpDto } from "./dto/sign-up.dto";
import { SignInDto } from "./dto/sign-in.dto";
import { AuthPayload } from "./dto/auth-payload.dto";
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    signUp(signUpDto: SignUpDto): Promise<AuthPayload>;
    signIn(signInDto: SignInDto): Promise<AuthPayload>;
    refresh(body: {
        refreshToken: string;
    }): Promise<AuthPayload>;
}
