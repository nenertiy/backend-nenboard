import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { TokenModule } from '../token/token.module';
import { PasswordModule } from '../password/password.module';

@Module({
  controllers: [AuthController],
  providers: [AuthService],
  imports: [UsersModule, TokenModule, PasswordModule],
})
export class AuthModule {}
