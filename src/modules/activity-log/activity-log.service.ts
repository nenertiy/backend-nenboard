import { Injectable, ConflictException } from '@nestjs/common';
import { Response } from 'express';
import { createWriteStream, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { ActivityLogRepository } from './activity-log.repository';
import { ActivityLogGateway } from './activity-log.gateway';
import { CreateActivityLogDto } from './dto/create-activity-log.dto';
import { parse } from 'json2csv';
import * as PDFDocument from 'pdfkit';
import * as archiver from 'archiver';
import { ProjectsService } from '../projects/projects.service';
@Injectable()
export class ActivityLogService {
  constructor(
    private readonly activityLogRepository: ActivityLogRepository,
    private readonly activityLogGateway: ActivityLogGateway,
    private readonly projectsService: ProjectsService,
  ) {}

  async createActivityLog(
    userId: string,
    projectId: string,
    taskId: string,
    data: CreateActivityLogDto,
  ) {
    const activityLog = await this.activityLogRepository.createActivityLog(
      userId,
      projectId,
      taskId,
      data,
    );

    this.activityLogGateway.server
      .to(`project_${projectId}`)
      .emit('activityLogUpdate', activityLog);

    const projectUsers =
      await this.projectsService.findUsersByProjectId(projectId);

    const rooms = projectUsers.map(
      (user) => `project_${'user' in user ? user.user.id : user.id}`,
    );

    if (rooms.length > 0) {
      this.activityLogGateway.server.socketsJoin(rooms);
    }

    return activityLog;
  }

  async findActivityLogs(projectId: string, sort: 'asc' | 'desc' = 'desc') {
    return this.activityLogRepository.findActivityLogs(projectId, sort);
  }

  async findActivityLog(id: string) {
    return this.activityLogRepository.findActivityLog(id);
  }

  async deleteProjectActivityLogs(projectId: string, res: Response) {
    const jsonFilePath = await this.exportActivityLogs(projectId, 'json');
    const csvFilePath = await this.exportActivityLogs(projectId, 'csv');
    const pdfFilePath = await this.exportActivityLogs(projectId, 'pdf');

    const archive = archiver('zip', {
      zlib: { level: 9 },
    });

    res.attachment(`activity_logs_${projectId}.zip`);

    archive.pipe(res);

    archive.file(jsonFilePath, { name: 'activity_logs.json' });
    archive.file(csvFilePath, { name: 'activity_logs.csv' });
    archive.file(pdfFilePath, { name: 'activity_logs.pdf' });

    await archive.finalize();
    return this.activityLogRepository.deleteProjectActivityLogs(projectId);
  }

  async exportActivityLogs(projectId: string, format: 'json' | 'csv' | 'pdf') {
    const logs = await this.activityLogRepository.findActivityLogs(
      projectId,
      'asc',
    );

    if (!logs.length) {
      throw new Error('No activity logs found for the specified project.');
    }

    const exportDir = join(__dirname, '../../exports');
    if (!existsSync(exportDir)) {
      mkdirSync(exportDir, { recursive: true });
    }

    const fileName = `activity_logs_${projectId}.${format}`;
    const filePath = join(exportDir, fileName);

    if (format === 'json') {
      writeFileSync(filePath, JSON.stringify(logs, null, 2));
      return filePath;
    }

    if (format === 'csv') {
      const fields = [
        'id',
        'title',
        'details',
        'action',
        'user.email',
        'project.name',
        'task.title',
        'createdAt',
      ];
      const csv = parse(logs, { fields });
      writeFileSync(filePath, csv);
      return filePath;
    }

    if (format === 'pdf') {
      return new Promise((resolve, reject) => {
        try {
          const doc = new PDFDocument({
            margin: 40,
            size: 'A4',
          });

          const stream = createWriteStream(filePath);
          doc.pipe(stream);

          doc
            .fontSize(24)
            .fillColor('#333333')
            .text(
              `Activity Logs for Project ${logs[0]?.project?.name || projectId}`,
              {
                align: 'center',
              },
            )
            .moveDown(2);

          logs.forEach((log, index) => {
            doc
              .rect(30, doc.y, 540, 100)
              .fill('#F8F8F8')
              .stroke()
              .fillColor('black');

            doc
              .moveDown(0.5)
              .fontSize(16)
              .fillColor('#0056b3')
              .text(log.title, { continued: true })
              .fontSize(10)
              .fillColor('#555555')
              .text(`  (${new Date(log.createdAt).toLocaleString()})`, {
                align: 'right',
              });

            doc
              .moveDown(0.5)
              .fontSize(12)
              .fillColor('black')
              .text(`Action: ${log.action}`)
              .text(`User: ${log.user.email}`);

            if (log.task) doc.text(`Task: ${log.task.title}`);
            if (log.details) doc.text(`Details: ${log.details}`);

            doc.moveDown();

            if (index < logs.length - 1) {
              doc
                .strokeColor('#CCCCCC')
                .lineWidth(1)
                .moveTo(30, doc.y)
                .lineTo(570, doc.y)
                .stroke()
                .moveDown();
            }
          });

          doc.end();
          stream.on('finish', () => resolve(filePath));
        } catch (error) {
          reject(error);
        }
      });
    }

    throw new ConflictException('Invalid format');
  }
}
