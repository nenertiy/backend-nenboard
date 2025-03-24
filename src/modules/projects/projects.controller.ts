import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Body,
  Get,
  Param,
  Put,
  Delete,
  Res,
  Query,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DecodeUser } from 'src/common/decorators/decode-user.decorator';
import { UserWithoutPassword } from 'src/common/types/user';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectRole } from 'src/common/decorators/project-role.decorator';
import { ProjectRoleGuard } from 'src/modules/auth/guards/project-role.guard';
import { UserRole, ActivityLogAction } from '@prisma/client';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { TasksService } from '../tasks/tasks.service';
import { CreateTaskDto } from '../tasks/dto/create-task.dto';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { Response } from 'express';

@ApiTags('Projects')
@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly tasksService: TasksService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  @ApiOperation({ summary: 'Get all user`s projects' })
  @ApiBearerAuth()
  @Get()
  @UseGuards(JwtAuthGuard)
  findProjects(@DecodeUser() user: UserWithoutPassword) {
    return this.projectsService.findProjects(user.id);
  }

  @ApiOperation({ summary: 'Get a project by id' })
  @ApiBearerAuth()
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findProject(@Param('id') id: string) {
    return this.projectsService.findProject(id);
  }

  @ApiOperation({ summary: 'Create a new project' })
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        name: { type: 'string' },
        description: { type: 'string' },
      },
    },
  })
  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async createProject(
    @Body() createProjectDto: CreateProjectDto,
    @DecodeUser() user: UserWithoutPassword,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const project = await this.projectsService.createProject(
      user.id,
      createProjectDto,
      file,
    );

    await this.activityLogService.createActivityLog(user.id, project.id, null, {
      title: `Project ${project.name} created`,
      details: `Project ${project.description} created`,
      action: ActivityLogAction.CREATED,
    });

    return project;
  }

  @ApiOperation({ summary: 'Update a project' })
  @ApiBearerAuth()
  @Put(':id')
  @UseGuards(JwtAuthGuard, ProjectRoleGuard)
  @ProjectRole(UserRole.OWNER)
  async updateProject(
    @Param('id') id: string,
    @DecodeUser() user: UserWithoutPassword,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    const project = await this.projectsService.updateProject(
      id,
      updateProjectDto,
    );

    await this.activityLogService.createActivityLog(user.id, id, null, {
      title: `Project ${project.name} updated`,
      details: `Project ${project.description} updated`,
      action: ActivityLogAction.UPDATED,
    });

    return project;
  }

  @ApiOperation({ summary: 'Delete a project' })
  @ApiBearerAuth()
  @Delete(':id')
  @UseGuards(JwtAuthGuard, ProjectRoleGuard)
  @ProjectRole(UserRole.OWNER)
  async deleteProject(@Param('id') id: string, @Res() res: Response) {
    await this.activityLogService.deleteProjectActivityLogs(id, res);

    await this.projectsService.deleteProject(id);
  }

  @ApiOperation({ summary: 'Get all activity logs for a project' })
  @ApiBearerAuth()
  @Get(':id/activity-logs')
  @UseGuards(JwtAuthGuard, ProjectRoleGuard)
  @ProjectRole(UserRole.OWNER)
  getActivityLogs(@Param('id') id: string) {
    return this.activityLogService.findActivityLogs(id);
  }

  @ApiOperation({ summary: 'Export activity logs for a project' })
  @ApiBearerAuth()
  @Get(':id/activity-logs/export')
  @UseGuards(JwtAuthGuard)
  async exportActivityLogs(
    @Param('id') projectId: string,
    @Query('format') format: 'json' | 'csv' | 'pdf',
    @Res() res: Response,
  ) {
    const filePath = await this.activityLogService.exportActivityLogs(
      projectId,
      format,
    );

    res.download(filePath as string);
  }

  @ApiOperation({ summary: 'Create a new task' })
  @ApiBearerAuth()
  @Post(':id/tasks')
  @UseGuards(JwtAuthGuard, ProjectRoleGuard)
  @ProjectRole(UserRole.OWNER, UserRole.ADMIN)
  async createTask(
    @Param('id') id: string,
    @Body() createTaskDto: CreateTaskDto,
    @DecodeUser() user: UserWithoutPassword,
  ) {
    const task = await this.tasksService.createTask(user.id, id, createTaskDto);

    await this.activityLogService.createActivityLog(user.id, id, task.id, {
      title: `Task with title: ${task.title} was created`,
      details: `Task with description: ${task.description} was created by ${user.email}`,
      action: ActivityLogAction.CREATED,
    });

    return task;
  }

  @ApiOperation({ summary: 'Get all project tasks' })
  @ApiBearerAuth()
  @Get(':id/tasks')
  @UseGuards(JwtAuthGuard)
  getProjectTasks(@Param('id') id: string) {
    return this.tasksService.getProjectTasks(id);
  }

  @ApiOperation({
    summary: 'Get all project tasks grouped by status and priority',
  })
  @ApiBearerAuth()
  @Get(':id/tasks/grouped')
  @UseGuards(JwtAuthGuard)
  getGroupedProjectTasks(@Param('id') id: string) {
    return this.tasksService.getGroupedProjectTasks(id);
  }

  @ApiOperation({ summary: 'Invite a user to a project' })
  @ApiBearerAuth()
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string' },
      },
    },
  })
  @Post(':id/invite')
  @UseGuards(JwtAuthGuard, ProjectRoleGuard)
  @ProjectRole(UserRole.OWNER, UserRole.ADMIN)
  async inviteUserToProject(
    @DecodeUser() user: UserWithoutPassword,
    @Param('id') projectId: string,
    @Body('email') email: string,
  ) {
    const invitation = await this.projectsService.inviteUserToProject(
      email,
      projectId,
    );

    await this.activityLogService.createActivityLog(
      invitation.user.id,
      projectId,
      null,
      {
        title: `User ${invitation.user.email} invited to project ${projectId}`,
        details: `User ${invitation.user.email} invited to project ${projectId} by ${user.email}`,
        action: ActivityLogAction.CREATED,
      },
    );

    return invitation;
  }

  @ApiOperation({ summary: 'Get all users by project id' })
  @ApiBearerAuth()
  @Get(':id/users')
  @UseGuards(JwtAuthGuard)
  getUsersByProjectId(@Param('id') projectId: string) {
    return this.projectsService.findUsersByProjectId(projectId);
  }

  @ApiOperation({ summary: 'Delete a user from a project' })
  @ApiBearerAuth()
  @Delete(':id/users/:userId')
  @UseGuards(JwtAuthGuard, ProjectRoleGuard)
  @ProjectRole(UserRole.OWNER, UserRole.ADMIN)
  async deleteUserFromProject(
    @DecodeUser() user: UserWithoutPassword,
    @Param('id') projectId: string,
    @Param('userId') userId: string,
  ) {
    const userProject = await this.projectsService.deleteUserFromProject(
      userId,
      projectId,
    );

    await this.activityLogService.createActivityLog(userId, projectId, null, {
      title: `User ${userProject.userId} deleted from project ${projectId}`,
      details: `User ${userProject.userId} deleted from project ${projectId} by ${user.email}`,
      action: ActivityLogAction.DELETED,
    });

    return {
      message: `User ${userProject.userId} deleted from project successfully`,
    };
  }

  @ApiOperation({ summary: 'Update a user`s role in a project' })
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        role: {
          type: 'string',
          enum: Object.values(UserRole).filter(
            (role) => role !== UserRole.OWNER && role !== UserRole.INVITED,
          ),
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  @Put(':id/users/:userId/role')
  @UseGuards(JwtAuthGuard, ProjectRoleGuard)
  @ProjectRole(UserRole.OWNER)
  async updateUserRole(
    @DecodeUser() user: UserWithoutPassword,
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body('role') role: UserRole,
  ) {
    const userProject = await this.projectsService.updateUserRole(
      userId,
      id,
      role,
    );

    await this.activityLogService.createActivityLog(userId, id, null, {
      title: `User ${userProject.userId} role updated to ${role}`,
      details: `User ${userProject.userId} role updated to ${role} by ${user.email}`,
      action: ActivityLogAction.UPDATED,
    });

    return userProject;
  }

  @ApiOperation({ summary: 'Get all sent invitations to the project' })
  @ApiBearerAuth()
  @Get(':id/invitations')
  @UseGuards(JwtAuthGuard, ProjectRoleGuard)
  @ProjectRole(UserRole.OWNER, UserRole.ADMIN)
  getProjectInvitations(@Param('id') projectId: string) {
    return this.projectsService.findProjectInvitations(projectId);
  }

  @ApiOperation({ summary: 'Delete an invitation' })
  @ApiBearerAuth()
  @Delete('invitations/:invitationId')
  @UseGuards(JwtAuthGuard, ProjectRoleGuard)
  @ProjectRole(UserRole.OWNER, UserRole.ADMIN)
  async deleteInvitation(
    @DecodeUser() user: UserWithoutPassword,
    @Param('invitationId') invitationId: string,
  ) {
    const invitation =
      await this.projectsService.deleteInvitation(invitationId);

    await this.activityLogService.createActivityLog(
      invitation.userId,
      invitation.projectId,
      null,
      {
        title: `Invitation for ${invitation.userId} deleted successfully`,
        details: `Invitation for ${invitation.userId} deleted successfully by ${user.email}`,
        action: ActivityLogAction.DELETED,
      },
    );

    return {
      message: `Invitation for ${invitation.userId} deleted successfully`,
    };
  }
}
