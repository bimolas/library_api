import { Controller, Get, UseGuards, Param, Body, Post } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RoleGuard } from "../auth/guards/role.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { AuthenticatedUser } from "../utils/authenticated-user.decorator";
import { CreateUserWithRoleDto } from "./dto/create-user-with-role.dto";
import { SignInDto } from "@/auth/dto/sign-in.dto";
@ApiTags("Users")
@Controller("users")
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get("profile")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Get current user profile" })
  async getProfile(@AuthenticatedUser() user: any) {
    return this.usersService.getUserProfile(user.userId);
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Get user by ID" })
  async getUserById(@Param("id") id: string) {
    return this.usersService.findById(id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles("ADMIN")
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "List all users (admin only)" })
  async getAllUsers() {
    return this.usersService.getAllUsers();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles("ADMIN")
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Create a new user (admin only)" })
  @ApiBody({ type: CreateUserWithRoleDto })
  async createUser(@Body() createUserDto: CreateUserWithRoleDto) {
    return this.usersService.createWithRole(createUserDto);
  }
}
