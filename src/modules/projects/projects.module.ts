import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { ProjectRepository } from './project.repository';
import { PrismaService } from '../app/prisma.service';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [MediaModule],
  controllers: [ProjectsController],
  providers: [ProjectsService, ProjectRepository, PrismaService],
})
export class ProjectsModule {}
