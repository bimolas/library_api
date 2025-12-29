import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString } from "class-validator";

export class CreateCommentDto {
  @ApiProperty({ example: "Great book!" })
  @IsString()
  message: string;

  @ApiProperty({ example: 5, required: false })
  @IsNumber()
  rating: number = 0;
}
