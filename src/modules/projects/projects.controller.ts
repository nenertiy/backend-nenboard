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
import { UserRole } from '@prisma/client';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { TasksService } from '../tasks/tasks.service';
import { CreateTaskDto } from '../tasks/dto/create-task.dto';
@ApiTags('Projects')
@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly tasksService: TasksService,
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
  createProject(
    @Body() createProjectDto: CreateProjectDto,
    @DecodeUser() user: UserWithoutPassword,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.projectsService.createProject(user.id, createProjectDto, file);
  }

  @ApiOperation({ summary: 'Update a project' })
  @ApiBearerAuth()
  @Put(':id')
  @UseGuards(JwtAuthGuard, ProjectRoleGuard)
  @ProjectRole(UserRole.OWNER)
  updateProject(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectsService.updateProject(id, updateProjectDto);
  }

  @ApiOperation({ summary: 'Delete a project' })
  @ApiBearerAuth()
  @Delete(':id')
  @UseGuards(JwtAuthGuard, ProjectRoleGuard)
  @ProjectRole(UserRole.OWNER)
  deleteProject(@Param('id') id: string) {
    return this.projectsService.deleteProject(id);
  }

  @ApiOperation({ summary: 'Create a new task' })
  @ApiBearerAuth()
  @Post(':id/tasks')
  @UseGuards(JwtAuthGuard, ProjectRoleGuard)
  @ProjectRole(UserRole.OWNER, UserRole.ADMIN)
  createTask(
    @Param('id') id: string,
    @Body() createTaskDto: CreateTaskDto,
    @DecodeUser() user: UserWithoutPassword,
  ) {
    return this.tasksService.createTask(user.id, id, createTaskDto);
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
  inviteUserToProject(
    @Param('id') projectId: string,
    @Body('email') email: string,
  ) {
    return this.projectsService.inviteUserToProject(email, projectId);
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
  deleteUserFromProject(
    @Param('id') projectId: string,
    @Param('userId') userId: string,
  ) {
    return this.projectsService.deleteUserFromProject(userId, projectId);
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
  updateUserRole(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body('role') role: UserRole,
  ) {
    return this.projectsService.updateUserRole(userId, id, role);
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
  deleteInvitation(@Param('invitationId') invitationId: string) {
    return this.projectsService.deleteInvitation(invitationId);
  }
}
