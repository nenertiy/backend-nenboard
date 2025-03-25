import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../app/prisma.service';
import { USER_SELECT } from 'src/common/types/include/user';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from '@prisma/client';
import { InvitationStatus } from '@prisma/client';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id }, select: USER_SELECT });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
      select: USER_SELECT,
    });
  }

  async findAll(query?: string, take?: number, skip?: number) {
    return this.prisma.user.findMany({
      take,
      skip,
      where: { username: { contains: query, mode: 'insensitive' } },
      select: USER_SELECT,
    });
  }

  async create(data: CreateUserDto) {
    return this.prisma.user.create({
      data,
      select: USER_SELECT,
    });
  }

  async update(id: string, data: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data,
      select: USER_SELECT,
    });
  }

  async delete(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }

  async findUserInvitations(userId: string) {
    return this.prisma.userProject.findMany({
      where: {
        userId,
        status: InvitationStatus.PENDING,
        role: UserRole.INVITED,
      },
      include: {
        project: true,
      },
    });
  }

  async findUserInvitation(invitationId: string) {
    return this.prisma.userProject.findUnique({
      where: { id: invitationId },
      include: {
        project: true,
      },
    });
  }

  async acceptJoinRequest(userId: string, projectId: string) {
    return this.prisma.userProject.update({
      where: { userId_projectId: { userId, projectId } },
      data: {
        role: UserRole.MEMBER,
        status: InvitationStatus.ACCEPTED,
        isActive: true,
      },
    });
  }

  async rejectJoinRequest(userId: string, projectId: string) {
    return this.prisma.userProject.delete({
      where: { userId_projectId: { userId, projectId } },
    });
  }
}
