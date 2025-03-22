import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ default: 'test project' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ default: 'test description' })
  @IsString()
  @IsOptional()
  description?: string;
}
