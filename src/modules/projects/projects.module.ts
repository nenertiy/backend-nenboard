import { forwardRef, Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { ProjectRepository } from './project.repository';
import { PrismaService } from '../app/prisma.service';
import { MediaModule } from '../media/media.module';
import { TasksModule } from '../tasks/tasks.module';
import { ActivityLogModule } from '../activity-log/activity-log.module';

@Module({
  imports: [MediaModule, TasksModule, forwardRef(() => ActivityLogModule)],
  controllers: [ProjectsController],
  providers: [ProjectsService, ProjectRepository, PrismaService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
