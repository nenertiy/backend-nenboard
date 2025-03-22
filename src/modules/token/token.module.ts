import { Module } from '@nestjs/common';
import { TokenService } from './token.service';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule,
    ConfigModule,
    UsersModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('ACCESS_TOKEN'),
        signOptions: { expiresIn: '1h' },
      }),
    }),
  ],
  providers: [TokenService, JwtStrategy],
  exports: [TokenService, JwtStrategy],
})
export class TokenModule {}
