import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Body,
  Delete,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Put,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiBody,
  ApiProperty,
} from "@nestjs/swagger";
import { BooksService } from "./books.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { RoleGuard } from "../auth/guards/role.guard";
import { CreateBookDto } from "./dto/create-book.dto";
import { IsNumber, IsString } from "class-validator";
import { AuthenticatedUser } from "@/utils/authenticated-user.decorator";
import { CreateCommentDto } from "./dto/Create-Comment.Dto";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname } from "path";

class AddCopiesDto {
  @ApiProperty({ example: 2 })
  @IsNumber()
  quantity: number;
}
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

@ApiTags("Books")
@Controller("books")
export class BooksController {
  constructor(private booksService: BooksService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles("ADMIN")
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Create a new book (admin only)" })
  @ApiBody({
    type: CreateBookDto,
  })
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: "./uploads/books",
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}${extname(
            file.originalname
          )}`;
          cb(null, unique);
        },
      }),
    })
  )
  async createBook(@Body() createBookDto: CreateBookDto,   @UploadedFile() file: any) {
    if (!file) throw new BadRequestException("No file uploaded");
    const avatarPath = `${BASE_URL}/uploads/books/${file.filename}`;

    createBookDto.coverImage = avatarPath;
    return this.booksService.createBook(createBookDto);
  }


  @Put(":id")
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles("ADMIN")
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Update a book (admin only)" })
  @ApiBody({
    type: CreateBookDto,
  })
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: "./uploads/books",
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}${extname(
            file.originalname
          )}`;
          cb(null, unique);
        },
      }),
    })
  )
  async updateBook(@Param("id") bookId: string, @Body() updateBookDto: CreateBookDto, @UploadedFile() file: any) {
    if (!file) throw new BadRequestException("No file uploaded");
    const avatarPath = `${BASE_URL}/uploads/books/${file.filename}`;

    updateBookDto.coverImage = avatarPath;
    return this.booksService.updateBook(bookId, updateBookDto);
  }

  @Post(":id/copies")
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles("ADMIN")
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Add copies to a book (admin only)" })
  @ApiBody({
    type: AddCopiesDto,
  })
  async addCopies(@Param("id") bookId: string, @Body() body: AddCopiesDto) {
    return this.booksService.addBookCopy(bookId, body.quantity);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles("ADMIN")
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Delete a book (admin only)" })
  async deleteBook(@Param("id") bookId: string) {
    return this.booksService.deleteBook(bookId);
  }

  @Delete(":id/copies")
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles("ADMIN")
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Delete copies of a book (admin only)" })
  async deleteBookCopies(
    @Param("id") bookId: string,
    @Query("quantity") quantity: number
  ) {
    return this.booksService.removeBookCopies(bookId, quantity);
  }

  @Get("search")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("access-token")
  @ApiQuery({ name: "q", required: true })
  @ApiOperation({ summary: "Search books by title, author, or ISBN" })
  async searchBooks(
    @Query("q") query: string,
    @Query("limit") limit = 20,
    @Query("skip") skip = 0
  ) {
    return this.booksService.searchBooks(query, limit, skip);
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Get book details" })
  async getBook(@Param("id") id: string) {
    return this.booksService.getBook(id);
  }

  @Post(":id/comments")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Add a comment/review to a book" })
  async addComment(
    @Param("id") bookId: string,
    @AuthenticatedUser() user: any,
    @Body() body: CreateCommentDto
  ) {
    return this.booksService.createComment(
      bookId,
      user.userId,
      body.message,
      body.rating
    );
  }

  @Get(":id/comments")
  @ApiOperation({ summary: "Get all comments for a book" })
  async getComments(@Param("id") bookId: string) {
    return this.booksService.getComments(bookId);
  }
}
