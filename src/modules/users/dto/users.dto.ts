import { ApiProperty, PickType } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(3, { message: 'First name must be at least 3 characters' })
  @ApiProperty({ example: 'John', required: true })
  firstName!: string;

  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Last name must be at least 3 characters' })
  @ApiProperty({ example: 'Doe', required: false })
  lastName?: string;

  @IsNotEmpty()
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @ApiProperty({ example: 'email@test.com', required: true })
  email!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(3, { message: 'Username must be at least 3 characters' })
  @ApiProperty({ example: 'username', required: true })
  username!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  @ApiProperty({ example: 'password123', required: true })
  password!: string;
}

export class UpdateUserDto extends PickType(CreateUserDto, [
  'firstName',
  'lastName',
  'email',
  'username',
] as const) {}

export class UpdateUserPasswordDto extends PickType(CreateUserDto, [
  'password',
] as const) {}

export class UserRoleDto {
  @IsNotEmpty()
  @IsInt()
  @ApiProperty({ example: 1, required: true })
  userId!: number;

  @IsNotEmpty()
  @IsInt()
  @ApiProperty({ example: 2, required: true })
  roleId!: number;
}
