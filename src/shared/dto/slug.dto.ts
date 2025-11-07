import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CheckSlugDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(3, { message: 'Slug must be at least 3 characters' })
  @ApiProperty({ example: 'slug-example', required: true })
  slug!: string;
}
