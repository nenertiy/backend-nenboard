import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { S3Module } from 'nestjs-s3';
import { RedisClientOptions } from 'redis';
import * as redisStore from 'cache-manager-ioredis';
import config from 'src/config/config';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { TokenModule } from '../token/token.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [config] }),
    CacheModule.registerAsync<RedisClientOptions>({
      imports: [ConfigModule],
      inject: [ConfigService],
      isGlobal: true,
      useFactory: async (configService: ConfigService) => {
        return {
          store: redisStore,
          host: configService.get('REDIS_URL'),
          port: 6379,
          ttl: 60 * 60,
          max: 1000000000000000000,
        };
      },
    }),
    S3Module.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        config: {
          credentials: {
            accessKeyId: configService.get('S3_ACCESS_KEY'),
            secretAccessKey: configService.get('S3_SECRET_KEY'),
          },
          endpoint: configService.get('S3_ENDPOINT'),
          region: configService.get('S3_REGION'),
          forcePathStyle: true,
          s3ForcePathStyle: true,
          signatureVersion: 'v4',
        },
      }),
    }),
    UsersModule,
    AuthModule,
    TokenModule,
  ],
})
export class AppModule {}
