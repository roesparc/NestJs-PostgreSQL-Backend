import { ApiProperty, PartialType } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";

export class CreateRoleDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(3, { message: "Role must be at least 3 characters" })
  @ApiProperty({ example: "name", required: true })
  name!: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: "description", required: false })
  description?: string;
}

export class UpdateRoleDto extends PartialType(CreateRoleDto) {}
