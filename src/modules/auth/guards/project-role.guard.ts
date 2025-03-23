import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { PrismaService } from 'src/modules/app/prisma.service';
import { PROJECT_ROLE_KEY } from 'src/common/decorators/project-role.decorator';

@Injectable()
export class ProjectRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      PROJECT_ROLE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    if (!userId) {
      throw new ForbiddenException('Unauthorized');
    }

    let projectId = request.params.projectId || request.params.id;
    const invitationId = request.params.invitationId;

    if (invitationId && request.url.includes('/invitations/')) {
      const invitation = await this.prisma.userProject.findUnique({
        where: { id: invitationId },
      });

      if (!invitation) {
        throw new NotFoundException('Invitation not found');
      }

      projectId = invitation.projectId;
    }

    if (projectId && request.url.includes('/tasks/')) {
      const task = await this.prisma.task.findUnique({
        where: { id: projectId },
        select: { projectId: true },
      });

      if (!task) {
        throw new NotFoundException('Task not found');
      }

      projectId = task.projectId;
    }

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const projectUser = await this.prisma.userProject.findUnique({
      where: { userId_projectId: { userId, projectId } },
      select: { role: true },
    });

    if (!projectUser || !requiredRoles.includes(projectUser.role)) {
      throw new ForbiddenException('Insufficient rights');
    }

    return true;
  }
}
