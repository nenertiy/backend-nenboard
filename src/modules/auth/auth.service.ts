import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { TokenService } from '../token/token.service';
import { PasswordService } from '../password/password.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { RefreshDto } from './dto/refresh.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tokenService: TokenService,
    private readonly passwordService: PasswordService,
  ) {}

  async signUp(dto: SignUpDto) {
    const user = await this.usersService.create(dto);
    const tokens = await this.generateTokens(user.id);
    return tokens;
  }

  async signIn(dto: SignInDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (
      !(await this.passwordService.comparePassword(dto.password, user.password))
    ) {
      throw new UnauthorizedException('Invalid password');
    }

    const tokens = await this.generateTokens(user.id);
    return tokens;
  }

  async refresh(dto: RefreshDto) {
    if (!dto.refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const payload = await this.tokenService.verifyRefreshToken(
      dto.refreshToken,
    );

    const tokens = await this.generateTokens(payload.id);
    return tokens;
  }

  private async generateTokens(userId: string) {
    const accessToken = await this.tokenService.generateAccessToken(userId);
    const refreshToken = await this.tokenService.generateRefreshToken(userId);
    return { accessToken, refreshToken };
  }
}
