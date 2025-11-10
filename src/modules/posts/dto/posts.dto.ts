import { ApiProperty, PartialType } from '@nestjs/swagger';
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
import { ToBoolean } from '../../../common/transformers/boolean.transformer';

export class CreatePostDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @ApiProperty({
    description: 'Title of the post.',
    required: true,
  })
  title!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @ApiProperty({
    description: 'Unique slug used to identify the post in URLs.',
    required: true,
  })
  slug!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @ApiProperty({
    description:
      'Main content body of the post. Can include text, markdown, or HTML.',
    required: true,
  })
  content!: string;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    description: 'Publication status of the post.',
    required: false,
  })
  published?: boolean;
}

export class UpdatePostDto extends PartialType(CreatePostDto) {}

export class GetPostsDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @ApiProperty({ description: 'Filter by post ID', required: false })
  id?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @ApiProperty({ description: 'Filter by author ID', required: false })
  authorId?: number;

  @IsOptional()
  @IsBoolean()
  @ToBoolean()
  @ApiProperty({
    description: 'Include author relation in results',
    required: false,
  })
  includeAuthor?: boolean;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'Filter by slug (exact match)', required: false })
  slug?: string;

  @IsOptional()
  @IsBoolean()
  @ToBoolean()
  @ApiProperty({ description: 'Filter by published status', required: false })
  published?: boolean;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Filter by term (partial match), supported fields: title',
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
  @ApiProperty({ description: 'Items per page', example: 50, required: false })
  pageSize: number = 50;

  @IsOptional()
  @IsIn(['id', 'title', 'authorId', 'published', 'createdAt', 'updatedAt'])
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
