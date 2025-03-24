import { Module } from '@nestjs/common';
import { ActivityLogService } from './activity-log.service';
import { ActivityLogController } from './activity-log.controller';
import { ActivityLogRepository } from './activity-log.repository';
import { PrismaService } from '../app/prisma.service';

@Module({
  controllers: [ActivityLogController],
  providers: [ActivityLogService, ActivityLogRepository, PrismaService],
  exports: [ActivityLogService],
})
export class ActivityLogModule {}
