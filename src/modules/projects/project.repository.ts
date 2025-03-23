import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InvitationStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../app/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import {
  PROJECT_SELECT,
  PROJECTS_SELECT,
} from 'src/common/types/include/project';
@Injectable()
export class ProjectRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createProject(userId: string, data: CreateProjectDto) {
    return this.prisma.$transaction(async (prisma) => {
      const project = await prisma.project.create({
        data,
        include: { projectImage: true },
      });

      await prisma.userProject.create({
        data: {
          userId,
          projectId: project.id,
          role: UserRole.OWNER,
          status: InvitationStatus.ACCEPTED,
          isActive: true,
        },
      });

      return project;
    });
  }

  async updateProject(projectId: string, data: UpdateProjectDto) {
    return this.prisma.project.update({
      where: { id: projectId },
      data,
    });
  }

  async deleteProject(projectId: string) {
    await this.prisma.project.delete({
      where: { id: projectId },
    });
  }

  async findProject(projectId: string) {
    return this.prisma.project.findUnique({
      where: { id: projectId },
      select: PROJECT_SELECT,
    });
  }

  async findProjects(userId: string) {
    return this.prisma.project.findMany({
      where: {
        users: { some: { userId } },
      },
      select: PROJECTS_SELECT,
    });
  }

  async findUsersByProjectId(projectId: string) {
    return this.prisma.userProject.findMany({
      where: { projectId, status: InvitationStatus.ACCEPTED },
      select: {
        user: { select: { id: true, email: true, username: true } },
      },
    });
  }

  async findUserProject(userId: string, projectId: string) {
    return this.prisma.userProject.findUnique({
      where: { userId_projectId: { userId, projectId } },
      include: {
        user: {
          select: { id: true, email: true, username: true, avatar: true },
        },
      },
    });
  }

  async updateUserRole(userId: string, projectId: string, role: UserRole) {
    return this.prisma.userProject.update({
      where: { userId_projectId: { userId, projectId } },
      data: { role },
    });
  }

  async findInvitation(invitationId: string) {
    return this.prisma.userProject.findUnique({
      where: { id: invitationId },
      include: {
        user: {
          select: { id: true, email: true, username: true, avatar: true },
        },
      },
    });
  }

  async findProjectInvitations(projectId: string) {
    return this.prisma.userProject.findMany({
      where: { projectId, status: InvitationStatus.PENDING },
      include: {
        user: {
          select: { id: true, email: true, username: true, avatar: true },
        },
      },
    });
  }

  async inviteUserToProject(email: string, projectId: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const userProject = await this.findUserProject(user.id, projectId);

    if (userProject) {
      if (userProject.status === InvitationStatus.PENDING) {
        throw new ConflictException('User already invited to project');
      }
      if (userProject.status === InvitationStatus.ACCEPTED) {
        throw new ConflictException('User already in project');
      }
    }

    return this.prisma.userProject.create({
      data: {
        userId: user.id,
        projectId,
        role: UserRole.INVITED,
        status: InvitationStatus.PENDING,
        isActive: false,
      },
      include: {
        user: {
          select: { id: true, email: true, username: true, avatar: true },
        },
      },
    });
  }

  async deleteInvitation(invitationId: string) {
    return this.prisma.userProject.delete({
      where: { id: invitationId },
    });
  }

  async deleteUserFromProject(userId: string, projectId: string) {
    return this.prisma.userProject.delete({
      where: { userId_projectId: { userId, projectId } },
    });
  }
}
