import { Injectable } from '@nestjs/common';
import { PrismaService } from '../app/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskStatus, TaskPriority } from '@prisma/client';
import { UpdateTaskDto } from './dto/update-task.dto';
@Injectable()
export class TasksRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createTask(userId: string, projectId: string, data: CreateTaskDto) {
    return this.prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        status: data.status,
        priority: data.priority,
        project: {
          connect: {
            id: projectId,
          },
        },
        createdBy: {
          connect: {
            id: userId,
          },
        },
        assignedTo: data.assignedToUserId
          ? { connect: { id: data.assignedToUserId } }
          : undefined,
        assignedBy: data.assignedToUserId
          ? { connect: { id: userId } }
          : undefined,
      },
    });
  }

  async updateTask(taskId: string, data: UpdateTaskDto) {
    return this.prisma.task.update({
      where: {
        id: taskId,
      },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async deleteTask(userId: string, taskId: string) {
    return this.prisma.task.update({
      where: {
        id: taskId,
      },
      data: {
        isDeleted: true,
        deletedByUserId: userId,
        deletedAt: new Date(),
        assignedToUserId: null,
        assignedByUserId: null,
      },
    });
  }

  async updateTaskStatus(taskId: string, status: TaskStatus) {
    return this.prisma.task.update({
      where: { id: taskId },
      data: { status, updatedAt: new Date() },
    });
  }

  async updateTaskPriority(taskId: string, priority: TaskPriority) {
    return this.prisma.task.update({
      where: { id: taskId },
      data: { priority, updatedAt: new Date() },
    });
  }

  async assignTask(userId: string, assignedToUserId: string, taskId: string) {
    return this.prisma.task.update({
      where: { id: taskId },
      data: {
        assignedToUserId: assignedToUserId,
        assignedByUserId: userId,
      },
    });
  }

  async archiveTask(userId: string, taskId: string) {
    return this.prisma.task.update({
      where: {
        id: taskId,
      },
      data: {
        isArchived: true,
        archivedByUserId: userId,
        archivedAt: new Date(),
      },
    });
  }

  async getProjectTasks(projectId: string) {
    return this.prisma.task.findMany({
      where: {
        projectId,
        isArchived: false,
        isDeleted: false,
      },
    });
  }

  async getUserTasks(userId: string) {
    return this.prisma.task.findMany({
      where: {
        assignedToUserId: userId,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async getTaskById(taskId: string) {
    return this.prisma.task.findUnique({
      where: {
        id: taskId,
      },
    });
  }
}
