import {
  Controller,
  Delete,
  Param,
  Put,
  UseGuards,
  Body,
  Get,
  UseInterceptors,
  UploadedFile,
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
import { UserRole, TaskStatus, TaskPriority } from '@prisma/client';
import { ProjectRole } from 'src/common/decorators/project-role.decorator';
import { UpdateTaskDto } from './dto/update-task.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Tasks')
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

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
  updateTask(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
    return this.tasksService.updateTask(id, updateTaskDto);
  }

  @ApiOperation({ summary: 'Delete a task' })
  @ApiBearerAuth()
  @Delete(':id')
  @UseGuards(JwtAuthGuard, ProjectRoleGuard)
  @ProjectRole(UserRole.OWNER, UserRole.ADMIN)
  deleteTask(@Param('id') id: string, @DecodeUser() user: UserWithoutPassword) {
    return this.tasksService.deleteTask(user.id, id);
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
  updateTaskStatus(
    @Param('id') id: string,
    @Body('status') status: TaskStatus,
  ) {
    return this.tasksService.updateTaskStatus(id, status);
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
  updateTaskPriority(
    @Param('id') id: string,
    @Body('priority') priority: TaskPriority,
  ) {
    return this.tasksService.updateTaskPriority(id, priority);
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
  assignTask(
    @Param('id') id: string,
    @Body('assignedToUserId') assignedToUserId: string,
    @DecodeUser() user: UserWithoutPassword,
  ) {
    return this.tasksService.assignTask(user.id, assignedToUserId, id);
  }

  @ApiOperation({ summary: 'Archive a task' })
  @ApiBearerAuth()
  @Put(':id/archive')
  @UseGuards(JwtAuthGuard, ProjectRoleGuard)
  @ProjectRole(UserRole.OWNER, UserRole.ADMIN)
  archiveTask(
    @Param('id') id: string,
    @DecodeUser() user: UserWithoutPassword,
  ) {
    return this.tasksService.archiveTask(user.id, id);
  }
}
