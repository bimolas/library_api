import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { ReservationService } from "./reservation.service";
import type { CreateReservationDto } from "./dto/create-reservation.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("Reservations")
@Controller("reservations")
export class ReservationController {
  constructor(private reservationService: ReservationService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Create a reservation" })
  async createReservation(
    user: any,
    @Body() createReservationDto: CreateReservationDto
  ) {
    return this.reservationService.createReservation(
      user.userId,
      createReservationDto
    );
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Cancel a reservation" })
  async cancelReservation(@Param("id") reservationId: string) {
    return this.reservationService.cancelReservation(reservationId);
  }

  @Get("book/:bookId/queue")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Get reservation queue for a book" })
  async getReservationQueue(@Param("bookId") bookId: string) {
    return this.reservationService.getReservationQueue(bookId);
  }

  @Get("book/:bookId/available-slot")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Get earliest available slot for a book" })
  async getEarliestAvailableSlot(@Param("bookId") bookId: string) {
    return this.reservationService.getEarliestAvailableSlot(bookId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Get user reservations" })
  async getUserReservations(user: any) {
    return this.reservationService.getUserReservations(user.userId);
  }
}
