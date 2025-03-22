import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ default: 'My Project' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ default: 'This is a project description' })
  @IsString()
  @IsOptional()
  description?: string;
}
