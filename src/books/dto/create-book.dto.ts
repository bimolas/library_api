import { IsString, IsISBN, IsNumber, Min, Max } from "class-validator"
import { ApiProperty } from "@nestjs/swagger"

export class CreateBookDto {
  @ApiProperty()
  @IsString()
  title: string

  @ApiProperty()
  @IsString()
  author: string

  @ApiProperty()
  @IsISBN()
  isbn: string

  @ApiProperty()
  @IsString()
  description: string

  @ApiProperty()
  @IsNumber()
  @Min(1800)
  @Max(2100)
  publicationYear: number

  @ApiProperty()
  @IsString()
  genre: string
}
