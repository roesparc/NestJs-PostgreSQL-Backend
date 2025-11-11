import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
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
import { ToBoolean } from '../../../common/transformers/boolean.transformer';
import { ToArray } from '../../../common/transformers/array.transformer';

export class CreateProjectDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @ApiProperty({
    description: 'Title of the project',
    required: true,
  })
  title!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @ApiProperty({
    description: 'Unique slug identifier',
    required: true,
  })
  slug!: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Short description or summary',
    required: false,
  })
  description?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'URL of the project’s source code repository',
    required: false,
  })
  repoUrl?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'URL of the live project demo or deployment',
    required: false,
  })
  demoUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({
    description:
      'List of technologies used in the project (e.g. NestJS, React, PostgreSQL)',
    required: false,
    type: [String],
  })
  techStack?: string[];

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    description: 'Marks the project as featured if set to true',
    required: false,
  })
  featured?: boolean;
}

export class UpdateProjectDto extends PartialType(CreateProjectDto) {}

export class GetProjectsDto {
  @IsOptional()
  @IsInt({ each: true })
  @Type(() => Number)
  @ToArray()
  @ApiProperty({
    description: 'Filter by one or more project IDs',
    type: [Number],
    required: false,
  })
  id?: number[];

  @IsOptional()
  @IsInt({ each: true })
  @Type(() => Number)
  @ToArray()
  @ApiProperty({
    description: 'Filter by one or more user IDs (project owner)',
    type: [Number],
    required: false,
  })
  userId?: number[];

  @IsOptional()
  @IsBoolean()
  @ToBoolean()
  @ApiProperty({
    description: 'Include project owner (user) in the result',
    required: false,
  })
  includeUser?: boolean;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'Filter by slug (exact match)', required: false })
  slug?: string;

  @IsOptional()
  @IsBoolean()
  @ToBoolean()
  @ApiProperty({
    description: 'Filter by featured status',
    required: false,
  })
  featured?: boolean;

  @IsOptional()
  @IsString({ each: true })
  @ToArray()
  @ApiProperty({
    description: 'Filter by one or more technologies',
    type: [String],
    required: false,
  })
  techStack?: string[];

  @IsOptional()
  @IsString()
  @ApiProperty({
    description:
      'Filter by term (partial match), supported fields: title, description, repoUrl and demoUrl',
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
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @ApiProperty({
    description: 'Page number (starts at 1)',
    example: 1,
    required: false,
  })
  page: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @ApiProperty({
    description: 'Items per page',
    example: 50,
    required: false,
  })
  pageSize: number = 50;

  @IsOptional()
  @IsIn(['id', 'title', 'featured', 'userId', 'createdAt', 'updatedAt'])
  @ApiProperty({
    description: 'Sort by field name',
    example: 'createdAt',
    required: false,
  })
  sortBy: string = 'createdAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  @ApiProperty({ description: 'Sort order', example: 'desc', required: false })
  sortOrder: string = 'desc';
}
