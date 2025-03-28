import { forwardRef, Module } from '@nestjs/common';
import { ActivityLogService } from './activity-log.service';
import { ActivityLogController } from './activity-log.controller';
import { ActivityLogRepository } from './activity-log.repository';
import { PrismaService } from '../app/prisma.service';
import { ActivityLogGateway } from './activity-log.gateway';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [forwardRef(() => ProjectsModule)],
  controllers: [ActivityLogController],
  providers: [
    ActivityLogService,
    ActivityLogRepository,
    PrismaService,
    ActivityLogGateway,
  ],
  exports: [ActivityLogService],
})
export class ActivityLogModule {}
