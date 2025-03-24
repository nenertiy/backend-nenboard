import { Injectable } from '@nestjs/common';
import { ActivityLogRepository } from './activity-log.repository';
import { CreateActivityLogDto } from './dto/create-activity-log.dto';

@Injectable()
export class ActivityLogService {
  constructor(private readonly activityLogRepository: ActivityLogRepository) {}

  async createActivityLog(
    userId: string,
    projectId: string,
    taskId: string,
    data: CreateActivityLogDto,
  ) {
    return this.activityLogRepository.createActivityLog(
      userId,
      projectId,
      taskId,
      data,
    );
  }

  async findActivityLogs(projectId: string) {
    return this.activityLogRepository.findActivityLogs(projectId);
  }

  async findActivityLog(id: string) {
    return this.activityLogRepository.findActivityLog(id);
  }

  async deleteProjectActivityLogs(projectId: string) {
    return this.activityLogRepository.deleteProjectActivityLogs(projectId);
  }
}
