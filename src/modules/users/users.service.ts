import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PasswordService } from '../password/password.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

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

  async findAll(take: number, skip: number) {
    const cachedUsers = await this.cacheManager.get('users');
    if (cachedUsers) {
      return cachedUsers;
    }

    const users = await this.usersRepository.findAll(take, skip);

    await this.cacheManager.set('users', users);

    return users;
  }

  async search(query: string, take: number, skip: number) {
    const cachedUsers = await this.cacheManager.get(`users_search_${query}`);
    if (cachedUsers) {
      return cachedUsers;
    }

    const users = await this.usersRepository.search(query, take, skip);

    await this.cacheManager.set(`users_search_${query}`, users);

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
