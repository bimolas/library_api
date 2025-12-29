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

  @ApiProperty({ example: "Fantasy" })
  @IsString()
  genre: string

  @ApiProperty({ example: "https://example.com/cover.jpg" })
  @IsString()
  @IsOptional()
  coverImage?: string

  @ApiProperty({ example: "Penguin Random House" })
  @IsString()
  publisher: string

  @ApiProperty({ example: 350 })
  @IsNumber()
  pages: number

  @ApiProperty({ example: "English" })
  @IsString()
  language: string
}
