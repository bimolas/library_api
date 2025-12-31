import { IsString, IsISBN, IsNumber, Min, Max, IsOptional } from "class-validator"
import { ApiProperty } from "@nestjs/swagger"

export class CreateBookDto {
  @ApiProperty({ example: "Harry Potter and the Philosopher's Stone" })
  @IsString()
  title: string

  @ApiProperty({ example: "J.K. Rowling" })
  @IsString()
  author: string

  @ApiProperty({ example: "978-3-16-148410-0" })
  @IsString()
  isbn: string

  @ApiProperty()
  @IsString()
  description: string

  @ApiProperty({ example: "Fantasy" })
  @IsString()
  genre: string

  @ApiProperty({ example: "https://example.com/cover.jpg" })
  @IsString()
  @IsOptional()
  coverImage?: string

  @ApiProperty({ example: 350 })
  @IsString()
  pages: string = "340";

  @ApiProperty({ example: 5 })
  @IsString()
  totalCopies: string = "5";
  @ApiProperty({ example: "English" })
  @IsString()
  language: string
}
