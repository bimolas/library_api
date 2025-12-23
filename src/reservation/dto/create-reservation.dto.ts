import { IsString, IsISO8601, IsNumber, Min } from "class-validator"
import { ApiProperty } from "@nestjs/swagger"

export class CreateReservationDto {
  @ApiProperty({ example: "c76ded2c-059c-47b7-a75b-5a71ec9306cc", description: "ID of the book to reserve" })
  @IsString()
  bookId: string

  @ApiProperty({ example: "2024-06-01", description: "Start date in ISO 8601 format" })
  @IsISO8601()
  startDate: string

  @ApiProperty({ example: 7, description: "Duration of the reservation in days" })
  @IsNumber()
  @Min(1)
  durationDays: number
}
