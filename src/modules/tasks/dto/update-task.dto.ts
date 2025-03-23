import { IsDateString, IsString } from 'class-validator';
import { IsOptional, IsEnum } from 'class-validator';
import { CreateTaskDto } from './create-task.dto';
import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { TaskPriority, TaskStatus } from '@prisma/client';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  @ApiProperty({ default: 'Task title' })
  @IsString()
  @IsOptional()
  title: string;

  @ApiProperty({ default: 'Task description' })
  @IsString()
  @IsOptional()
  description: string;

  @ApiProperty({ type: Date })
  @IsDateString()
  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value).toISOString() : null))
  dueDate: Date;

  @ApiProperty({ type: String, enum: TaskStatus })
  @IsEnum(TaskStatus)
  @IsOptional()
  status: TaskStatus;

  @ApiProperty({ type: String, enum: TaskPriority })
  @IsEnum(TaskPriority)
  @IsOptional()
  priority: TaskPriority;
}
