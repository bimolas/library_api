import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  Body,
  Query,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from "@nestjs/swagger";
import { BorrowingService } from "./borrowing.service";
import { CreateBorrowDto } from "./dto/create-borrow.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@ApiTags("Borrowing")
@Controller("borrowing")
export class BorrowingController {
  constructor(private borrowingService: BorrowingService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Borrow a book" })
  @ApiBody({ type: CreateBorrowDto })
  async borrowBook(
    @Body() createBorrowDto: CreateBorrowDto,
    @CurrentUser() user: any
  ) {
    return this.borrowingService.borrowBook(user.userId, createBorrowDto);
  }

  @Post(":id/return")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Return a borrowed book" })
  async returnBook(@Param("id") borrowId: string, @CurrentUser() user: any) {
    return this.borrowingService.returnBook(borrowId, user.userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Get user borrow history" })
  async getUserBorrows(@CurrentUser() user: any) {
    return this.borrowingService.getUserBorrows(user.userId);
  }

  @Get("user/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Get user borrow history" })
  async getUserBorrowsById(@Param("id") id: string) {
    return this.borrowingService.getUserBorrows(id);
  }

  @Get("overdue")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Get overdue books" })
  async getOverdueBooks(@CurrentUser() user: any) {
    return this.borrowingService.getOverdueBooks(user.userId);
  }

  @Get("nearby-latest")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("access-token")
  @ApiOperation({
    summary: "Get latest borrowings from users with score close to yours",
  })
  async getNearbyLatestBorrows(
    @CurrentUser() user: any,
    @Query("tolerance") tolerance?: string,
    @Query("limit") limit?: string
  ) {
    const tol = tolerance ? parseFloat(tolerance) : 10;
    const lim = limit ? parseInt(limit, 10) : 10;
    return this.borrowingService.getLatestBorrowsByNearbyScores(
      user.userId,
      tol,
      lim
    );
  }
  @Get("stats/monthly/last")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Monthly borrow stats for the past N months (default 6)" })
  async getMonthlyStatsLast(
    @Query("months") months?: string
  ) {
    const m = months ? parseInt(months, 10) : 6;
    return this.borrowingService.getMonthlyBorrowStatsLastMonths(m);
  }
}
