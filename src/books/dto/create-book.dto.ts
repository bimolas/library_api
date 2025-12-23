import { IsString, IsISBN, IsNumber, Min, Max } from "class-validator"
import { ApiProperty } from "@nestjs/swagger"

export class CreateBookDto {
  @ApiProperty()
  @IsString()
  title: string

  @ApiProperty()
  @IsString()
  author: string

  @ApiProperty({ example: "978-3-16-148410-0" })
  @IsISBN()
  isbn: string

  @ApiProperty()
  @IsString()
  description: string

  @ApiProperty({ example: 2020 })
  @IsNumber()
  @Min(1800)
  @Max(2100)
  publicationYear: number

  @ApiProperty()
  @IsString()
  genre: string
}
