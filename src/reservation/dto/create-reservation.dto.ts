import { IsString, IsISO8601, IsNumber, Min } from "class-validator"
import { ApiProperty } from "@nestjs/swagger"

export class CreateReservationDto {
  @ApiProperty()
  @IsString()
  bookId: string

  @ApiProperty()
  @IsISO8601()
  startDate: string

  @ApiProperty()
  @IsNumber()
  @Min(1)
  durationDays: number
}
