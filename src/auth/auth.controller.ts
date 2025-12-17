import { Controller, Post } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import type { SignUpDto } from "./dto/sign-up.dto";
import type { SignInDto } from "./dto/sign-in.dto";
import { AuthPayload } from "./dto/auth-payload.dto";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("sign-up")
  @ApiOperation({ summary: "Register a new user" })
  @ApiResponse({ status: 201, type: AuthPayload })
  async signUp(signUpDto: SignUpDto): Promise<AuthPayload> {
    return this.authService.signUp(signUpDto);
  }

  @Post("sign-in")
  @ApiOperation({ summary: "User login" })
  @ApiResponse({ status: 200, type: AuthPayload })
  async signIn(signInDto: SignInDto): Promise<AuthPayload> {
    return this.authService.signIn(signInDto);
  }

  @Post("refresh")
  @ApiOperation({ summary: "Refresh access token" })
  @ApiResponse({ status: 200, type: AuthPayload })
  async refresh(body: { refreshToken: string }): Promise<AuthPayload> {
    return this.authService.refreshToken(body.refreshToken);
  }
}
