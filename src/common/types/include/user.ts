import { Prisma } from '@prisma/client';

export const USER_SELECT: Prisma.UserSelect = {
  id: true,
  username: true,
  email: true,
  avatar: true,
  projects: {
    select: {
      role: true,
      status: true,
      isActive: true,
      project: true,
    },
  },
};
