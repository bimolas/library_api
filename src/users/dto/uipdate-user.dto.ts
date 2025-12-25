import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class UpdateUserDto {
    @ApiProperty({ example: "John Doe" })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiProperty({ example: "newpassword123" })
    @IsString()
    @IsOptional()
    password?: string;

    @ApiProperty({ example: "john.doe@example.com" })
    @IsString()
    @IsOptional()
    email?: string;

    @ApiProperty({ example: "https://example.com/image.jpg" })
    @IsString()
    @IsOptional()
    imageUrl?: string;

    @ApiProperty({ example: "USER" })
    @IsString()
    @IsOptional()
    role?: string;
}