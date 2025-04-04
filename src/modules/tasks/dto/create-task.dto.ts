import {
  IsString,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
} from 'class-validator';
import { TaskPriority, TaskStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateTaskDto {
  @ApiProperty({ default: 'Task title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ default: 'Task description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ type: Date })
  @IsDateString()
  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value).toISOString() : null))
  dueDate: Date;

  @ApiProperty({ default: TaskStatus.TODO })
  @IsEnum(TaskStatus)
  @IsOptional()
  status: TaskStatus;

  @ApiProperty({ default: TaskPriority.LOW })
  @IsEnum(TaskPriority)
  @IsOptional()
  priority: TaskPriority;

  @ApiProperty()
  @IsUUID()
  @IsOptional()
  assignedToUserId: string;
}
