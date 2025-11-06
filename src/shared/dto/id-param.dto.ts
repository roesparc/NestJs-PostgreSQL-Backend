import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class IdParamDto {
  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  @ApiProperty({
    example: 1,
    description: 'The unique numeric ID of the resource',
  })
  id!: number;
}
