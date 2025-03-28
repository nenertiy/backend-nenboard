import { PROJECT_SELECT } from 'src/common/types/include/project';
import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ProjectRepository } from './project.repository';
import { CreateProjectDto } from './dto/create-project.dto';
import { MediaService } from '../media/media.service';
import { UpdateProjectDto } from './dto/update-project.dto';
import { InvitationStatus, User, UserRole } from '@prisma/client';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Project } from '@prisma/client';
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
    const createdProject = await this.projectRepository.createProject(
      userId,
      data,
    );
    if (file) {
      await this.mediaService.uploadProjectImage(createdProject.id, file);
    }

    await this.cacheManager.set(`project_${createdProject.id}`, createdProject);
    await this.cacheManager.del(`projects_${userId}`);

    const project = await this.projectRepository.findProject(createdProject.id);

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

  async findProjects(
    userId: string,
    query?: string,
    take?: number,
    skip?: number,
  ): Promise<Project[]> {
    const cachedProjects = await this.cacheManager.get<Project[]>(
      `projects_${userId}_${query}_${take}_${skip}`,
    );
    if (cachedProjects && cachedProjects.length > 0) {
      return cachedProjects;
    }

    const projects = await this.projectRepository.findProjects(
      userId,
      query,
      take,
      skip,
    );
    if (projects.length === 0) {
      await this.cacheManager.set(
        `projects_${userId}_${query}_${take}_${skip}`,
        [],
      );
      throw new NotFoundException('No projects found');
    }

    await this.cacheManager.set(
      `projects_${userId}_${query}_${take}_${skip}`,
      projects,
    );

    return projects;
  }

  async findProject(projectId: string): Promise<Project> {
    const cachedProject = await this.cacheManager.get<Project>(
      `project_${projectId}`,
    );
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

  async findUsersByProjectId(projectId: string) {
    const cachedUsers = await this.cacheManager.get(`users_${projectId}`);
    if (cachedUsers) {
      return cachedUsers as User[];
    }

    const users = await this.projectRepository.findUsersByProjectId(projectId);
    if (users.length === 0) {
      throw new NotFoundException('No users found');
    }

    await this.cacheManager.set(`users_${projectId}`, users);

    return users;
  }

  async updateUserRole(userId: string, projectId: string, role: UserRole) {
    const userProject = await this.projectRepository.findUserProject(
      userId,
      projectId,
    );
    if (!userProject) {
      throw new NotFoundException('User not found in project');
    }
    if (userProject.status === InvitationStatus.PENDING) {
      throw new BadRequestException('User is not in project');
    }
    if (role === UserRole.OWNER) {
      throw new BadRequestException('Owner can be only one');
    }
    if (userProject.role === role) {
      throw new BadRequestException('User already has this role');
    }

    return this.projectRepository.updateUserRole(userId, projectId, role);
  }

  async findProjectInvitations(projectId: string) {
    const cachedInvitations = await this.cacheManager.get(
      `invitations_${projectId}`,
    );
    if (cachedInvitations) {
      return cachedInvitations;
    }

    const invitations =
      await this.projectRepository.findProjectInvitations(projectId);
    if (invitations.length === 0) {
      throw new NotFoundException('No invitations found');
    }

    await this.cacheManager.set(`invitations_${projectId}`, invitations);

    return invitations;
  }

  async inviteUserToProject(email: string, projectId: string) {
    const invitation = await this.projectRepository.inviteUserToProject(
      email,
      projectId,
    );

    await this.cacheManager.del(`invitations_${projectId}`);
    await this.cacheManager.set(`invitation_${invitation.id}`, invitation);

    return invitation;
  }

  async deleteInvitation(invitationId: string) {
    const invitation =
      await this.projectRepository.findInvitation(invitationId);
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    await this.cacheManager.del(`invitation_${invitationId}`);
    await this.cacheManager.del(`invitations_${invitation.projectId}`);

    return this.projectRepository.deleteInvitation(invitationId);
  }

  async deleteUserFromProject(userId: string, projectId: string) {
    const userProject = await this.projectRepository.findUserProject(
      userId,
      projectId,
    );
    if (!userProject) {
      throw new NotFoundException('User not found in project');
    }

    await this.cacheManager.del(`users_${projectId}`);
    await this.cacheManager.del(`project_${projectId}`);

    return this.projectRepository.deleteUserFromProject(userId, projectId);
  }
}
