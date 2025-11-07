import { ApiProperty, PartialType, PickType } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateProjectDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(3, { message: 'Title must be at least 3 characters' })
  @ApiProperty({ example: 'Portfolio Website', required: true })
  title!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(3, { message: 'Slug must be at least 3 characters' })
  @ApiProperty({ example: 'portfolio-website', required: true })
  slug!: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    example: 'A modern portfolio site showcasing projects',
    required: false,
  })
  description?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    example: 'https://github.com/username/portfolio',
    required: false,
  })
  repoUrl?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'https://portfolio.example.com', required: false })
  demoUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({
    example: ['NestJS', 'React', 'PostgreSQL'],
    required: false,
    type: [String],
  })
  techStack?: string[];

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    example: false,
    required: false,
  })
  featured?: boolean;
}

export class UpdateProjectDto extends PartialType(CreateProjectDto) {}
