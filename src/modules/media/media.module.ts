import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { MediaRepository } from './media.repository';
import { PrismaService } from '../app/prisma.service';

@Module({
  controllers: [MediaController],
  providers: [MediaService, MediaRepository, PrismaService],
  exports: [MediaService],
})
export class MediaModule {}
