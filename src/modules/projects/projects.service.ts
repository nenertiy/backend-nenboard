import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ProjectRepository } from './project.repository';
import { CreateProjectDto } from './dto/create-project.dto';
import { MediaService } from '../media/media.service';
import { UpdateProjectDto } from './dto/update-project.dto';
import { InvitationStatus } from '@prisma/client';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class ProjectsService {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
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

    await this.cacheManager.set(`project_${project.id}`, project);
    await this.cacheManager.del(`projects_${userId}`);
    return project;
  }

  async updateProject(projectId: string, data: UpdateProjectDto) {
    await this.cacheManager.del(`project_${projectId}`);

    const project = await this.projectRepository.findProject(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    for (const user of project.users) {
      await this.cacheManager.del(`projects_${user.userId}`);
    }
    await this.cacheManager.set(`project_${projectId}`, project);

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

    for (const user of project.users) {
      await this.cacheManager.del(`projects_${user.userId}`);
    }
    await this.cacheManager.del(`project_${projectId}`);

    return { message: 'Project deleted successfully' };
  }

  async findProjects(userId: string) {
    const cachedProjects = await this.cacheManager.get(`projects_${userId}`);
    if (cachedProjects) {
      return cachedProjects;
    }

    const projects = await this.projectRepository.findProjects(userId);
    if (projects.length === 0) {
      throw new NotFoundException('No projects found');
    }

    await this.cacheManager.set(`projects_${userId}`, projects);

    return projects;
  }

  async findProject(projectId: string) {
    const cachedProject = await this.cacheManager.get(`project_${projectId}`);
    if (cachedProject) {
      return cachedProject;
    }

    const project = await this.projectRepository.findProject(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    await this.cacheManager.set(`project_${projectId}`, project);

    return project;
  }

  async findUserInvitation(userId: string) {
    const invitations = await this.projectRepository.findUserInvitation(userId);
    if (invitations.length === 0) {
      throw new NotFoundException('No invitations found');
    }

    return invitations;
  }

  async requestToJoinProject(email: string, projectId: string) {
    return this.projectRepository.requestToJoinProject(email, projectId);
  }

  async respondToJoinProject(
    userId: string,
    projectId: string,
    status: InvitationStatus,
  ) {
    if (status === InvitationStatus.ACCEPTED) {
      await this.cacheManager.del(`project_${projectId}`);
      await this.cacheManager.del(`projects_${userId}`);
      return this.projectRepository.acceptJoinRequest(userId, projectId);
    }
    return this.projectRepository.rejectJoinRequest(userId, projectId);
  }
}
