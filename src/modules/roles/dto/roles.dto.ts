import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { ToArray } from '../../../common/transformers/array.transformer';
import { ToBoolean } from '../../../common/transformers/boolean.transformer';

const ALL_FIELDS = Object.values(Prisma.RoleScalarFieldEnum);
const SORTABLE_FIELDS = ALL_FIELDS.filter(
  (f) => f !== Prisma.RoleScalarFieldEnum.description,
);

export class CreateRoleDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(3, { message: 'Role must be at least 3 characters' })
  @ApiProperty({ example: 'name', required: true })
  name!: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'description', required: false })
  description?: string;
}

export class UpdateRoleDto extends PartialType(CreateRoleDto) {}

export class GetRolesDto {
  @IsOptional()
  @IsInt({ each: true })
  @Type(() => Number)
  @ToArray()
  @ApiProperty({
    description: 'Filter by one or more role IDs',
    type: [Number],
    required: false,
  })
  id?: number[];

  @IsOptional()
  @IsInt({ each: true })
  @Type(() => Number)
  @ToArray()
  @ApiProperty({
    description: 'Filter by one or more user IDs',
    type: [Number],
    required: false,
  })
  userId?: number[];

  @IsOptional()
  @IsBoolean()
  @ToBoolean()
  @ApiProperty({
    description: 'Include users in the result',
    required: false,
  })
  includeUsers?: boolean;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Filter by term (partial match), supported fields: name',
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
