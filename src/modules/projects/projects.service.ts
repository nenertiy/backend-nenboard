import { Injectable, NotFoundException } from '@nestjs/common';
import { ProjectRepository } from './project.repository';
import { CreateProjectDto } from './dto/create-project.dto';
import { MediaService } from '../media/media.service';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly mediaService: MediaService,
  ) {}

  async createProject(
    userId: string,
    data: CreateProjectDto,
    file?: Express.Multer.File,
  ) {
    const project = await this.projectRepository.createProject(userId, data);
    if (file) {
      await this.mediaService.uploadProjectImage(project.id, file);
    }
    return project;
  }

  async updateProject(projectId: string, data: UpdateProjectDto) {
    const project = await this.projectRepository.findProject(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return this.projectRepository.updateProject(projectId, data);
  }

  async deleteProject(projectId: string) {
    const project = await this.projectRepository.findProject(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    if (project.projectImage) {
      await this.mediaService.deleteProjectImage(projectId);
    }
    await this.projectRepository.deleteProject(projectId);

    return { message: 'Project deleted successfully' };
  }

  async findProjects(userId: string) {
    const projects = await this.projectRepository.findProjects(userId);
    if (projects.length === 0) {
      throw new NotFoundException('No projects found');
    }
    return projects;
  }

  async findProject(projectId: string) {
    const project = await this.projectRepository.findProject(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }
}
