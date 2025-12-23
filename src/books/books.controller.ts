import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Body,
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

class AddCopiesDto {
  @ApiProperty({ example: 2 })
  @IsNumber()
  quantity: number;
}

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
  async createBook(@Body() createBookDto: CreateBookDto) {
    return this.booksService.createBook(createBookDto);
  }

  @Post(":id/copies")
  @UseGuards(JwtAuthGuard, RoleGuard)
  // @Roles("ADMIN")
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Add copies to a book (admin only)" })
  @ApiBody({
    type: AddCopiesDto,
  })
  async addCopies(@Param("id") bookId: string, @Body() body: AddCopiesDto) {
    return this.booksService.addBookCopy(bookId, body.quantity);
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
}
