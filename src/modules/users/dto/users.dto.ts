import { ApiProperty, PickType } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  MinLength,
  IsBoolean,
  IsDateString,
  IsIn,
  Min,
} from 'class-validator';
import { ToArray } from '../../../common/transformers/array.transformer';
import { ToBoolean } from '../../../common/transformers/boolean.transformer';

const ALL_FIELDS = Object.values(Prisma.UserScalarFieldEnum);
const SORTABLE_FIELDS = ALL_FIELDS.filter(
  (f) => f !== Prisma.UserScalarFieldEnum.hash,
);

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @ApiProperty({ description: 'User first name', required: true })
  firstName!: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @ApiProperty({ description: 'User last name', required: false })
  lastName?: string;

  @IsNotEmpty()
  @IsEmail()
  @ApiProperty({
    description: 'User email, can be used for login',
    required: true,
  })
  email!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @ApiProperty({
    description: 'User username, can be used for login',
    required: true,
  })
  username!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @ApiProperty({ description: 'User password', required: true })
  password!: string;
}

export class UpdateUserDto extends PickType(CreateUserDto, [
  'firstName',
  'lastName',
  'email',
  'username',
] as const) {}

export class CheckUsernameDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @ApiProperty({ description: 'username', required: true })
  username!: string;
}

export class UpdateUserPasswordDto extends PickType(CreateUserDto, [
  'password',
] as const) {}

export class UserRoleDto {
  @IsNotEmpty()
  @IsInt()
  @ApiProperty({ description: 'User id to associate role', required: true })
  userId!: number;

  @IsNotEmpty()
  @IsInt()
  @ApiProperty({ description: 'Role id to be associated', required: true })
  roleId!: number;
}

export class GetUsersDto {
  @IsOptional()
  @IsInt({ each: true })
  @Type(() => Number)
  @ToArray()
  @ApiProperty({
    description: 'Filter by one or more user IDs',
    type: [Number],
    required: false,
  })
  id?: number[];

  @IsOptional()
  @IsInt({ each: true })
  @Type(() => Number)
  @ToArray()
  @ApiProperty({
    description: 'Filter by one or more role IDs',
    type: [Number],
    required: false,
  })
  roleId?: number[];

  @IsOptional()
  @IsBoolean()
  @ToBoolean()
  @ApiProperty({
    description: 'Include roles in the result',
    required: false,
  })
  includeRoles?: boolean;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Filter by username (exact match)',
    required: false,
  })
  username?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Filter by email (exact match)',
    required: false,
  })
  email?: string;

  @IsOptional()
  @IsBoolean()
  @ToBoolean()
  @ApiProperty({
    description: 'Filter by active status',
    required: false,
  })
  isActive?: boolean;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description:
      'Filter by term (partial match), supported fields: first_name, last_name, email, username',
    required: false,
  })
  term?: string;

  @IsOptional()
  @IsDateString()
  @ApiProperty({
    description: 'Created after this date (ISO string)',
    required: false,
  })
  createdAtFrom?: string;

  @IsOptional()
  @IsDateString()
  @ApiProperty({
    description: 'Created before this date (ISO string)',
    required: false,
  })
  createdAtTo?: string;

  @IsOptional()
  @IsIn(SORTABLE_FIELDS)
  @ApiProperty({
    description: 'Sort by field name (default createdAt)',
    enum: SORTABLE_FIELDS,
    required: false,
  })
  sortBy: string = 'createdAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  @ApiProperty({
    description: 'Sort order (default desc)',
    enum: ['asc', 'desc'],
    required: false,
  })
  sortOrder: string = 'desc';

  @IsOptional()
  @IsBoolean()
  @ToBoolean()
  @ApiProperty({
    description: 'Returns pagination metadata along with items',
    required: false,
  })
  withPagination?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @ApiProperty({
    description: 'Page number (starts at 1)',
    required: false,
  })
  page: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @ApiProperty({ description: 'Items per page (default 50)', required: false })
  pageSize: number = 50;

  @IsOptional()
  @IsString({ each: true })
  @ToArray()
  @IsIn(ALL_FIELDS, { each: true })
  @ApiProperty({
    description: 'Select specific fields to return',
    type: [String],
    enum: ALL_FIELDS,
    required: false,
  })
  field?: string[];
}
