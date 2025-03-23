import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TasksRepository } from './tasks.repository';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskPriority, TaskStatus } from '@prisma/client';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
@Injectable()
export class TasksService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly tasksRepository: TasksRepository,
  ) {}

  async createTask(userId: string, projectId: string, data: CreateTaskDto) {
    const task = await this.tasksRepository.createTask(userId, projectId, data);
    await this.cacheManager.set(`task_${task.id}`, task);
    return task;
  }

  async updateTask(taskId: string, data: UpdateTaskDto) {
    await this.cacheManager.del(`task_${taskId}`);

    const task = await this.getTaskById(taskId);
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.cacheManager.set(`task_${taskId}`, task);

    return this.tasksRepository.updateTask(taskId, data);
  }

  async deleteTask(userId: string, taskId: string) {
    await this.cacheManager.del(`task_${taskId}`);
    const task = await this.getTaskById(taskId);
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return this.tasksRepository.deleteTask(userId, taskId);
  }

  async updateTaskStatus(taskId: string, status: TaskStatus) {
    await this.cacheManager.del(`task_${taskId}`);

    const task = await this.tasksRepository.getTaskById(taskId);
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.isDeleted || task.isArchived) {
      throw new BadRequestException(
        'Cannot update status of a deleted or archived task',
      );
    }

    if (!Object.values(TaskStatus).includes(status)) {
      throw new BadRequestException(
        `Invalid status. Available statuses are: ${Object.values(
          TaskStatus,
        ).join(', ')}`,
      );
    }

    const updatedTask = await this.tasksRepository.updateTaskStatus(
      taskId,
      status,
    );

    await this.cacheManager.set(`task_${taskId}`, updatedTask);
    return updatedTask;
  }

  async updateTaskPriority(taskId: string, priority: TaskPriority) {
    await this.cacheManager.del(`task_${taskId}`);

    const task = await this.tasksRepository.getTaskById(taskId);
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.isDeleted || task.isArchived) {
      throw new BadRequestException(
        'Cannot update priority of a deleted or archived task',
      );
    }

    if (!Object.values(TaskPriority).includes(priority)) {
      throw new BadRequestException(
        `Invalid priority. Available priorities are: ${Object.values(
          TaskPriority,
        ).join(', ')}`,
      );
    }

    const updatedTask = await this.tasksRepository.updateTaskPriority(
      taskId,
      priority,
    );

    await this.cacheManager.set(`task_${taskId}`, updatedTask);
    return updatedTask;
  }

  async assignTask(userId: string, assignedToUserId: string, taskId: string) {
    const task = await this.getTaskById(taskId);
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return this.tasksRepository.assignTask(userId, assignedToUserId, taskId);
  }

  async archiveTask(userId: string, taskId: string) {
    await this.cacheManager.del(`task_${taskId}`);

    const task = await this.getTaskById(taskId);
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    await this.cacheManager.set(`task_${taskId}`, task);

    return this.tasksRepository.archiveTask(userId, taskId);
  }

  async getTaskById(taskId: string) {
    const cachedTask = await this.cacheManager.get(`task_${taskId}`);
    if (cachedTask) {
      return cachedTask;
    }

    const task = await this.tasksRepository.getTaskById(taskId);
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.cacheManager.set(`task_${task.id}`, task);

    return task;
  }

  async getProjectTasks(projectId: string) {
    const cachedTasks = await this.cacheManager.get(`tasks_${projectId}`);
    if (cachedTasks) {
      return cachedTasks;
    }

    const tasks = await this.tasksRepository.getProjectTasks(projectId);
    if (tasks.length === 0) {
      throw new NotFoundException('No tasks found');
    }

    const doneTasks = tasks.filter((task) => task.status === TaskStatus.DONE);
    const inProgressTasks = tasks.filter(
      (task) => task.status === TaskStatus.IN_PROGRESS,
    );
    const todoTasks = tasks.filter((task) => task.status === TaskStatus.TODO);

    await this.cacheManager.set(`tasks_${projectId}`, {
      tasks,
      todoTasks: todoTasks.length,
      inProgressTasks: inProgressTasks.length,
      doneTasks: doneTasks.length,
      totalTasks: tasks.length,
    });

    return {
      tasks,
      todoTasks: todoTasks.length,
      inProgressTasks: inProgressTasks.length,
      doneTasks: doneTasks.length,
      totalTasks: tasks.length,
    };
  }

  async getGroupedProjectTasks(projectId: string) {
    const cachedTasks = await this.cacheManager.get(
      `tasks_${projectId}_grouped`,
    );
    if (cachedTasks) {
      return cachedTasks;
    }

    const tasks = await this.tasksRepository.getProjectTasks(projectId);
    if (tasks.length === 0) {
      throw new NotFoundException('No tasks found');
    }
    const groupedTasks = tasks.reduce((statusAcc, task) => {
      if (!statusAcc[task.status]) {
        statusAcc[task.status] = {
          LOW: [],
          MEDIUM: [],
          HIGH: [],
        };
      }
      statusAcc[task.status][task.priority].push(task);
      return statusAcc;
    }, {});

    for (const status in groupedTasks) {
      for (const priority in groupedTasks[status]) {
        groupedTasks[status][priority].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
      }
    }
    const doneTasks = tasks.filter((task) => task.status === TaskStatus.DONE);
    const inProgressTasks = tasks.filter(
      (task) => task.status === TaskStatus.IN_PROGRESS,
    );
    const todoTasks = tasks.filter((task) => task.status === TaskStatus.TODO);

    await this.cacheManager.set(`tasks_${projectId}_grouped`, {
      tasks: groupedTasks,
      todoTasks: todoTasks.length,
      inProgressTasks: inProgressTasks.length,
      doneTasks: doneTasks.length,
      totalTasks: tasks.length,
    });

    return {
      tasks: groupedTasks,
      todoTasks: todoTasks.length,
      inProgressTasks: inProgressTasks.length,
      doneTasks: doneTasks.length,
      totalTasks: tasks.length,
    };
  }

  async getUserTasks(userId: string) {
    const cachedTasks = await this.cacheManager.get(`tasks_${userId}`);
    if (cachedTasks) {
      return cachedTasks;
    }

    const tasks = await this.tasksRepository.getUserTasks(userId);
    if (tasks.length === 0) {
      throw new NotFoundException('No tasks found');
    }

    await this.cacheManager.set(`tasks_${userId}`, tasks);

    return tasks;
  }
}
