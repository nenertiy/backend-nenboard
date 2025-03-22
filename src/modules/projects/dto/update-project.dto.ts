import { IsString } from 'class-validator';
import { IsOptional } from 'class-validator';
import { CreateProjectDto } from './create-project.dto';
import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProjectDto extends PartialType(CreateProjectDto) {
  @ApiProperty({ default: 'Updated Project Name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ default: 'Updated description' })
  @IsString()
  @IsOptional()
  description?: string;
}
