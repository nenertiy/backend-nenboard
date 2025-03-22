import { Injectable } from '@nestjs/common';
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
    return this.prisma.project.delete({
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
}
