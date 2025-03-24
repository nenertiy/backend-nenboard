import { ApiProperty } from '@nestjs/swagger';
import { ActivityLogAction } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateActivityLogDto {
  @ApiProperty({ description: 'The title of the activity log' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'The details of the activity log' })
  @IsString()
  @IsOptional()
  details?: string;

  @ApiProperty({ description: 'The action of the activity log' })
  @IsEnum(ActivityLogAction)
  action: ActivityLogAction;
}
