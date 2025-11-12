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
import { ToArray } from '../../../common/transformers/array.transformer';
import { Prisma } from '@prisma/client';

const ALL_FIELDS = Object.values(Prisma.PostScalarFieldEnum);
const SORTABLE_FIELDS = ALL_FIELDS.filter(
  (f) =>
    f !== Prisma.PostScalarFieldEnum.slug &&
    f !== Prisma.PostScalarFieldEnum.content,
);

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
  @IsInt({ each: true })
  @Type(() => Number)
  @ToArray()
  @ApiProperty({
    description: 'Filter by one or more post IDs',
    type: [Number],
    required: false,
  })
  id?: number[];

  @IsOptional()
  @IsInt({ each: true })
  @Type(() => Number)
  @ToArray()
  @ApiProperty({
    description: 'Filter by one or more author IDs',
    type: [Number],
    required: false,
  })
  authorId?: number[];

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
