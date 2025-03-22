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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @ApiOperation({ summary: 'Create a new project' })
  @ApiBearerAuth()
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

  @ApiOperation({ summary: 'Get all users projects' })
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
}
