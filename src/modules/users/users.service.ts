import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
  BadRequestException,
} from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PasswordService } from '../password/password.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { InvitationStatus } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly usersRepository: UsersRepository,
    private readonly passwordService: PasswordService,
  ) {}

  async findById(id: string) {
    const cachedUser = await this.cacheManager.get(`user_${id}`);
    if (cachedUser) {
      return cachedUser;
    }

    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.cacheManager.set(`user_${id}`, user);

    return user;
  }

  async findByEmail(email: string) {
    const user = await this.usersRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByUsername(username: string) {
    const cachedUser = await this.cacheManager.get(`user_${username}`);
    if (cachedUser) {
      return cachedUser;
    }

    const user = await this.usersRepository.findByUsername(username);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.cacheManager.set(`user_${username}`, user);

    return user;
  }

  async findAll(query?: string, take?: number, skip?: number) {
    const cachedUsers = await this.cacheManager.get(
      `users_${query}_${take}_${skip}`,
    );
    if (cachedUsers) {
      return cachedUsers;
    }

    const users = await this.usersRepository.findAll(query, take, skip);

    await this.cacheManager.set(`users_${query}_${take}_${skip}`, users);

    return users;
  }

  async create(dto: CreateUserDto) {
    await this.checkUserExistsByEmail(dto.email);
    await this.checkUserExistsByUsername(dto.username);

    const hashedPassword = await this.passwordService.hashPassword(
      dto.password,
    );
    const user = await this.usersRepository.create({
      ...dto,
      password: hashedPassword,
    });

    await this.cacheManager.del('users');
    await this.cacheManager.set(`user_${user.id}`, user);

    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.checkUserExistsById(id);

    await this.cacheManager.del('users');
    await this.cacheManager.del(`user_${id}`);

    if (dto.password) {
      const hashedPassword = await this.passwordService.hashPassword(
        dto.password,
      );
      await this.usersRepository.update(id, {
        ...dto,
        password: hashedPassword,
      });
    }

    const user = await this.usersRepository.update(id, {
      ...dto,
    });

    await this.cacheManager.set(`user_${user.id}`, user);

    return user;
  }

  async delete(id: string) {
    await this.checkUserExistsById(id);

    await this.cacheManager.del('users');
    await this.cacheManager.del(`user_${id}`);

    await this.usersRepository.delete(id);
  }

  async findUserInvitation(userId: string) {
    const invitations = await this.usersRepository.findUserInvitations(userId);
    if (invitations.length === 0) {
      throw new NotFoundException('No invitations found');
    }
    return invitations;
  }

  async respondToJoinProject(
    userId: string,
    invitationId: string,
    status: InvitationStatus,
  ) {
    const invitation =
      await this.usersRepository.findUserInvitation(invitationId);

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (status === InvitationStatus.PENDING) {
      throw new BadRequestException('Invitation is pending');
    }

    if (status === InvitationStatus.ACCEPTED) {
      await this.cacheManager.del(`project_${invitation.projectId}`);
      await this.cacheManager.del(`projects_${userId}`);

      await this.usersRepository.acceptJoinRequest(
        userId,
        invitation.projectId,
      );
      return {
        message: 'Invitation accepted',
      };
    }

    await this.usersRepository.rejectJoinRequest(userId, invitation.projectId);
    return {
      message: 'Invitation rejected',
    };
  }

  private async checkUserExistsByEmail(email: string) {
    const user = await this.usersRepository.findByEmail(email);
    if (user) {
      throw new ConflictException('User already exists');
    }
  }

  private async checkUserExistsByUsername(username: string) {
    const user = await this.usersRepository.findByUsername(username);
    if (user) {
      throw new ConflictException('User already exists');
    }
  }

  private async checkUserExistsById(id: string) {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
  }
}
