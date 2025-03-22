import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsEmail } from 'class-validator';
import { IsString } from 'class-validator';
import { IsOptional } from 'class-validator';
import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiProperty({ default: 'new username' })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiProperty({ default: 'new email@gmail.com' })
  @Transform(({ value }) => value.toLowerCase())
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ default: 'new password' })
  @IsString()
  @IsOptional()
  password?: string;
}
