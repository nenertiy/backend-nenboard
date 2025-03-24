import {
  Controller,
  Delete,
  Param,
  Put,
  UseGuards,
  Body,
  Get,
  UseInterceptors,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DecodeUser } from 'src/common/decorators/decode-user.decorator';
import { UserWithoutPassword } from 'src/common/types/user';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { ProjectRoleGuard } from '../auth/guards/project-role.guard';
import {
  UserRole,
  TaskStatus,
  TaskPriority,
  ActivityLogAction,
} from '@prisma/client';
import { ProjectRole } from 'src/common/decorators/project-role.decorator';
import { UpdateTaskDto } from './dto/update-task.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ActivityLogService } from '../activity-log/activity-log.service';
@ApiTags('Tasks')
@Controller('tasks')
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  @ApiOperation({ summary: 'Get a task by id' })
  @ApiBearerAuth()
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  getTask(@Param('id') id: string) {
    return this.tasksService.getTaskById(id);
  }

  @ApiOperation({ summary: 'Update a task' })
  @ApiBearerAuth()
  @Put(':id')
  @UseGuards(JwtAuthGuard, ProjectRoleGuard)
  @ProjectRole(UserRole.OWNER, UserRole.ADMIN)
  async updateTask(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @DecodeUser() user: UserWithoutPassword,
  ) {
    const task = await this.tasksService.updateTask(id, updateTaskDto);

    await this.activityLogService.createActivityLog(
      user.id,
      task.projectId,
      task.id,
      {
        title: `Task with title: ${task.title} was updated`,
        details: `Task with description: ${task.description} was updated by ${user.email}`,
        action: ActivityLogAction.UPDATED,
      },
    );

    return task;
  }

  @ApiOperation({ summary: 'Delete a task' })
  @ApiBearerAuth()
  @Delete(':id')
  @UseGuards(JwtAuthGuard, ProjectRoleGuard)
  @ProjectRole(UserRole.OWNER, UserRole.ADMIN)
  async deleteTask(
    @Param('id') id: string,
    @DecodeUser() user: UserWithoutPassword,
  ) {
    const task = await this.tasksService.deleteTask(user.id, id);

    await this.activityLogService.createActivityLog(
      user.id,
      task.projectId,
      task.id,
      {
        title: `Task with title: ${task.title} was deleted`,
        details: `Task with description: ${task.description} was deleted by ${user.email}`,
        action: ActivityLogAction.DELETED,
      },
    );

    return { message: 'Task deleted successfully' };
  }

  @ApiOperation({ summary: 'Update a task status' })
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: Object.values(TaskStatus) },
      },
    },
  })
  @Put(':id/status')
  @UseInterceptors(FileInterceptor('file'))
  @UseGuards(JwtAuthGuard, ProjectRoleGuard)
  @ProjectRole(UserRole.OWNER, UserRole.ADMIN)
  async updateTaskStatus(
    @Param('id') id: string,
    @Body('status') status: TaskStatus,
    @DecodeUser() user: UserWithoutPassword,
  ) {
    const task = await this.tasksService.updateTaskStatus(id, status);

    await this.activityLogService.createActivityLog(
      user.id,
      task.projectId,
      task.id,
      {
        title: `Task with title: ${task.title} status was updated to ${status}`,
        details: `Task with description: ${task.description} status was updated to ${status} by ${user.email}`,
        action: ActivityLogAction.UPDATED,
      },
    );

    return task;
  }

  @ApiOperation({ summary: 'Update a task priority' })
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        priority: { type: 'string', enum: Object.values(TaskPriority) },
      },
    },
  })
  @Put(':id/priority')
  @UseInterceptors(FileInterceptor('file'))
  @UseGuards(JwtAuthGuard, ProjectRoleGuard)
  @ProjectRole(UserRole.OWNER, UserRole.ADMIN)
  async updateTaskPriority(
    @Param('id') id: string,
    @Body('priority') priority: TaskPriority,
    @DecodeUser() user: UserWithoutPassword,
  ) {
    const task = await this.tasksService.updateTaskPriority(id, priority);

    await this.activityLogService.createActivityLog(
      user.id,
      task.projectId,
      task.id,
      {
        title: `Task with title: ${task.title} priority was updated to ${priority}`,
        details: `Task with description: ${task.description} priority was updated to ${priority} by ${user.email}`,
        action: ActivityLogAction.UPDATED,
      },
    );

    return task;
  }

  @ApiOperation({ summary: 'Assign a task to a user' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        assignedToUserId: { type: 'string' },
      },
    },
  })
  @ApiBearerAuth()
  @Put(':id/assign')
  @UseGuards(JwtAuthGuard, ProjectRoleGuard)
  @ProjectRole(UserRole.OWNER, UserRole.ADMIN)
  async assignTask(
    @Param('id') id: string,
    @Body('assignedToUserId') assignedToUserId: string,
    @DecodeUser() user: UserWithoutPassword,
  ) {
    const task = await this.tasksService.assignTask(
      user.id,
      assignedToUserId,
      id,
    );

    await this.activityLogService.createActivityLog(
      user.id,
      task.projectId,
      task.id,
      {
        title: `Task with title: ${task.title} was assigned to ${assignedToUserId}`,
        details: `Task with description: ${task.description} was assigned to ${assignedToUserId} by ${user.email}`,
        action: ActivityLogAction.UPDATED,
      },
    );

    return task;
  }

  @ApiOperation({ summary: 'Archive a task' })
  @ApiBearerAuth()
  @Put(':id/archive')
  @UseGuards(JwtAuthGuard, ProjectRoleGuard)
  @ProjectRole(UserRole.OWNER, UserRole.ADMIN)
  async archiveTask(
    @Param('id') id: string,
    @DecodeUser() user: UserWithoutPassword,
  ) {
    const task = await this.tasksService.archiveTask(user.id, id);

    await this.activityLogService.createActivityLog(
      user.id,
      task.projectId,
      task.id,
      {
        title: `Task with title: ${task.title} was archived`,
        details: `Task with description: ${task.description} was archived by ${user.email}`,
        action: ActivityLogAction.ARCHIVED,
      },
    );

    return task;
  }
}
