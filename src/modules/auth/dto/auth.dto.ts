import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: "Username must be at least 3 characters" })
  @ApiProperty({ example: "username" })
  username!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: "Password must be at least 6 characters" })
  @ApiProperty({ example: "password" })
  password!: string;
}
