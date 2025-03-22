import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { MediaType } from '@prisma/client';

export class CreateMediaDto {
  @IsString()
  @IsNotEmpty()
  url: string;

  @IsString()
  @IsNotEmpty()
  filename: string;

  @IsEnum(MediaType)
  @IsNotEmpty()
  type: MediaType;
}
