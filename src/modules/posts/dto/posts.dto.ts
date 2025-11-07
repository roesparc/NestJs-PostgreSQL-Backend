import { ApiProperty, OmitType, PartialType, PickType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreatePostDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(3, { message: 'Title must be at least 3 characters' })
  @ApiProperty({ example: 'Understanding NestJS DTOs', required: true })
  title!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(3, { message: 'Slug must be at least 3 characters' })
  @ApiProperty({ example: 'understanding-nestjs-dtos', required: true })
  slug!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(3, { message: 'Content must be at least 3 characters' })
  @ApiProperty({
    example:
      'In this article, we will explore how to use DTOs effectively in a NestJS project...',
    required: true,
  })
  content!: string;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    example: false,
    required: false,
  })
  published?: boolean;

  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  @ApiProperty({
    example: 1,
    required: true,
  })
  authorId!: number;
}

export class UpdatePostDto extends PartialType(
  OmitType(CreatePostDto, ['authorId'] as const),
) {}

export class CheckPostSlugDto extends PickType(CreatePostDto, [
  'slug',
  'authorId',
] as const) {}
