import { Injectable } from '@nestjs/common';
import { PrismaService } from '../app/prisma.service';
import { CreateActivityLogDto } from './dto/create-activity-log.dto';

@Injectable()
export class ActivityLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createActivityLog(
    userId: string,
    projectId: string,
    taskId: string,
    data: CreateActivityLogDto,
  ) {
    return this.prisma.activityLog.create({
      data: {
        ...data,
        user: {
          connect: {
            id: userId,
          },
        },
        project: {
          connect: {
            id: projectId,
          },
        },
        task: {
          connect: {
            id: taskId,
          },
        },
      },
    });
  }

  async findActivityLogs(projectId: string) {
    return this.prisma.activityLog.findMany({
      where: {
        projectId,
      },
      //   include: {
      //     user: true,
      //     project: true,
      //     task: true,
      //   },
    });
  }

  async findActivityLog(id: string) {
    return this.prisma.activityLog.findUnique({
      where: { id },
    });
  }

  async deleteProjectActivityLogs(projectId: string) {
    return this.prisma.activityLog.deleteMany({
      where: { projectId },
    });
  }
}
