import {
  Controller,
  Get,
  UseGuards,
  Param,
  Body,
  Post,
  Put,
  UploadedFile,
  BadRequestException,
  UseInterceptors,
  Delete,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RoleGuard } from "../auth/guards/role.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { AuthenticatedUser } from "../utils/authenticated-user.decorator";
import { CreateUserWithRoleDto } from "./dto/create-user-with-role.dto";
import { SignInDto } from "@/auth/dto/sign-in.dto";
import { UpdateUserDto } from "./dto/uipdate-user.dto";
import * as express from "express";
import { FileInterceptor } from "@nestjs/platform-express";
import { extname } from "path";
import { diskStorage } from "multer";
import { BanUserDto } from "./dto/ban-user.dto";
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
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

  @Post(":id/ban")
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles("ADMIN")
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Ban a user (admin only)" })
  @ApiBody({ type: BanUserDto })
  async banUser(@Param("id") id: string, @Body() body: BanUserDto) {
    return this.usersService.banUser(id, body);
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

  @Put(":id")
  @UseGuards(JwtAuthGuard, RoleGuard)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Update a user " })
  @ApiBody({ type: UpdateUserDto })
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: "./uploads",
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}${extname(
            file.originalname
          )}`;
          cb(null, unique);
        },
      }),
    })
  )
  async updateUser(
    @Param("id") id: string,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() file: any
  ) {
    if (!file) throw new BadRequestException("No file uploaded");
    const avatarPath = `${BASE_URL}/uploads/${file.filename}`;

    updateUserDto.imageUrl = avatarPath;
    return this.usersService.updateUser(id, updateUserDto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles("ADMIN")
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Delete a user (admin only)" })
  async deleteUser(@Param("id") id: string) {
    return this.usersService.deleteUser(id);
  }
}
