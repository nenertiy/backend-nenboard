import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { TasksRepository } from './tasks.repository';
import { PrismaService } from '../app/prisma.service';

@Module({
  controllers: [TasksController],
  providers: [TasksService, TasksRepository, PrismaService],
  exports: [TasksService],
})
export class TasksModule {}
