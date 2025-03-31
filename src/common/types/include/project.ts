import { Prisma } from '@prisma/client';

export const PROJECT_SELECT = {
  id: true,
  name: true,
  description: true,
  projectImage: { select: { id: true, url: true, filename: true } },
  createdAt: true,
  updatedAt: true,
  users: {
    select: {
      role: true,
      status: true,
      isActive: true,
      userId: true,
      user: {
        select: {
          username: true,
          email: true,
          avatar: {
            select: {
              id: true,
              url: true,
              filename: true,
            },
          },
        },
      },
    },
  },
  tasks: {
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      dueDate: true,
      completedAt: true,
      isArchived: true,
      archivedAt: true,
      archivedBy: { select: { id: true, username: true } },
      createdBy: { select: { id: true, username: true } },
      assignedTo: { select: { id: true, username: true } },
      assignedBy: { select: { id: true, username: true } },
      createdAt: true,
      updatedAt: true,
    },
  },
} satisfies Prisma.ProjectSelect;

export const PROJECTS_SELECT = {
  id: true,
  name: true,
  description: true,
  projectImage: { select: { id: true, url: true, filename: true } },
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProjectSelect;
