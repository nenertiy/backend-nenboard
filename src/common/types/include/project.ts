import { Prisma } from '@prisma/client';

export const PROJECT_SELECT: Prisma.ProjectSelect = {
  id: true,
  name: true,
  description: true,
  projectImage: true,
  createdAt: true,
  updatedAt: true,
  users: {
    select: {
      role: true,
      status: true,
      isActive: true,
      userId: true,
      user: true,
    },
  },
  tasks: true,
};

export const PROJECTS_SELECT: Prisma.ProjectSelect = {
  id: true,
  name: true,
  description: true,
  projectImage: true,
  createdAt: true,
  updatedAt: true,
};
