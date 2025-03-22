import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateUserDto {
  @ApiProperty({ default: 'user' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ default: 'user@gmail.com' })
  @Transform(({ value }) => value.toLowerCase())
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ default: 'password' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
