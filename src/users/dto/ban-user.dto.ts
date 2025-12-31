import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString } from "class-validator";

export class BanUserDto {
  @IsString()
  @ApiProperty({ example: "Violation of terms of service" })
  reason: string;

  @IsNumber()
  @ApiProperty({ example: 7 })
  days: number;

  @IsString()
  @ApiProperty({ example: "2024-12-31T23:59:59Z" })
  until: string;
}
