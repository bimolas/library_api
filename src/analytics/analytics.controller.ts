import { Controller, Get, UseGuards, Param, Query } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { AnalyticsService } from "./analytics.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RoleGuard } from "../auth/guards/role.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "@/auth/decorators/current-user.decorator";
import { AuthenticatedUser } from "@/utils/authenticated-user.decorator";

@ApiTags("Analytics")
@Controller("analytics")
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get("user/me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Get analytics for current user" })
  async getUserAnalytics(@CurrentUser() user: any) {
    return this.analyticsService.getUserAnalytics(user.userId);
  }

  @Get("summary")
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles("ADMIN")
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Platform summary: total borrows, reservations, users and avg borrow days (admin only)" })
  async getPlatformSummary() {
    return this.analyticsService.getPlatformSummary();
  }

  @Get("book/:id/availability")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Get book availability analytics" })
  async getBookAvailability(@Param("id") id: string) {
    return this.analyticsService.getBookAvailability(id);
  }

  @Get("trending-books")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Get trending books" })
  async getTrendingBooks() {
    return this.analyticsService.getTrendingBooks();
  }

  @Get("most-reserved")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Get most reserved books" })
  async getMostReservedBooks() {
    return this.analyticsService.getMostReservedBooks();
  }

  @Get("demand-vs-supply")
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles("ADMIN")
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Get demand vs supply analysis (admin only)" })
  async getDemandVsSupply() {
    return this.analyticsService.getDemandVsSupply();
  }

  @Get("user/:userId/genre-distribution")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Get genre distribution for a user" })
  async getGenreDistribution(@Param("userId") userId: string) {
    return this.analyticsService.getGenreDistribution(userId);
  }

  @Get("late-returns")
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles("ADMIN")
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Get late return statistics (admin only)" })
  async getLateReturnStatistics() {
    return this.analyticsService.getLateReturnStatistics();
  }

  @Get("user/recommendations")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Get recommended books for a user" })
  async getRecommendations(@AuthenticatedUser() user: any, @Query("limit") limit = 10) {
    return this.analyticsService.getRecommendations(user.userId, Number(limit));
  }

  @Get("user/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Get recommended books for a user" })
  async getUserAnaliticById(@Param("id") id: string) {
    return this.analyticsService.getUserAnalytics(id);
  }
}
