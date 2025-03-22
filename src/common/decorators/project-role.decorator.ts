import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const PROJECT_ROLE_KEY = 'projectRoles';
export const ProjectRole = (...roles: UserRole[]) =>
  SetMetadata(PROJECT_ROLE_KEY, roles);
