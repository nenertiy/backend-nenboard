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
    private reflector: Reflector,
    private prisma: PrismaService,
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
    const projectId = request.params.id;
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { users: { select: { userId: true } } },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (!userId || !projectId) {
      throw new ForbiddenException('No access');
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
