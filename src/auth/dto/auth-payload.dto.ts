import { ApiProperty } from "@nestjs/swagger"

export class UserPayload {
  @ApiProperty()
  id: string

  @ApiProperty()
  email: string

  @ApiProperty()
  name: string

  @ApiProperty({ enum: ["USER", "ADMIN"] })
  role: string
}

export class AuthPayload {
  @ApiProperty()
  accessToken: string

  @ApiProperty()
  refreshToken: string

  @ApiProperty()
  user: UserPayload
}
