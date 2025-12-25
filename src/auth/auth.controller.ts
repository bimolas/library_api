import { Body, Controller, Get, Post } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { SignUpDto } from "./dto/sign-up.dto";
import { SignInDto } from "./dto/sign-in.dto";
import { AuthPayload } from "./dto/auth-payload.dto";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("sign-up")
  @ApiOperation({ summary: "Register a new user" })
  @ApiResponse({ status: 201, type: AuthPayload })
  @ApiBody({ type: SignUpDto })
  async signUp(@Body() signUpDto: SignUpDto): Promise<AuthPayload> {
    return this.authService.signUp(signUpDto);
  }

  @Post("sign-in")
  @ApiOperation({ summary: "User login" })
  @ApiResponse({ status: 200, type: AuthPayload })
  @ApiBody({ type: SignInDto })
  async signIn(@Body() signInDto: SignInDto): Promise<AuthPayload> {
    return this.authService.signIn(signInDto);
  }

  @Post("refresh")
  @ApiOperation({ summary: "Refresh access token" })
  @ApiResponse({ status: 200, type: AuthPayload })
  @ApiBody({ schema: { properties: { refreshToken: { type: "string" } } } })
  async refresh(@Body() body: { refreshToken: string }): Promise<AuthPayload> {
    return this.authService.refreshToken(body.refreshToken);
  }

}
