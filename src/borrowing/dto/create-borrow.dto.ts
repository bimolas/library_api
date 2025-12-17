import { IsString, IsOptional, IsNumber, Min, Max } from "class-validator"
import { ApiProperty } from "@nestjs/swagger"

export class CreateBorrowDto {
  @ApiProperty()
  @IsString()
  bookId: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(7)
  @Max(90)
  durationDays?: number
}
