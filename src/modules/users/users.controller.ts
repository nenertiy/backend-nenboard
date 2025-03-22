import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
  Body,
  UploadedFile,
  Post,
  UseInterceptors,
  FileTypeValidator,
  ParseFilePipe,
  Delete,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DecodeUser } from 'src/common/decorators/decode-user.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';
import { UserWithoutPassword } from 'src/common/types/user';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MediaService } from '../media/media.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaType } from '@prisma/client';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly mediaService: MediaService,
  ) {}

  @ApiOperation({ summary: 'Get current user' })
  @ApiBearerAuth()
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getMe(@DecodeUser() user: UserWithoutPassword) {
    return this.usersService.findById(user.id);
  }

  @ApiOperation({ summary: 'Update user' })
  @ApiBearerAuth()
  @Patch()
  @UseGuards(JwtAuthGuard)
  async updateUser(
    @DecodeUser() user: UserWithoutPassword,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(user.id, dto);
  }

  @ApiOperation({ summary: 'Get all users' })
  @Get()
  async findAll(
    @Query('query') query: string,
    @Query('take') take: number = 10,
    @Query('skip') skip: number = 0,
  ) {
    if (query) {
      return this.usersService.search(query, take, skip);
    }
    return this.usersService.findAll(take, skip);
  }

  @ApiOperation({ summary: 'Get user by id' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @ApiOperation({ summary: 'Upload avatar' })
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth()
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        type: {
          type: 'string',
          enum: Object.values(MediaType),
        },
      },
    },
  })
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  @Post('avatar')
  async uploadAvatar(
    @DecodeUser() user: UserWithoutPassword,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({
            fileType: /^(image\/jpeg|image\/png)$/,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.mediaService.uploadAvatar(user.id, file);
  }

  @ApiOperation({ summary: 'Delete avatar' })
  @ApiBearerAuth()
  @Delete('avatar')
  @UseGuards(JwtAuthGuard)
  async deleteAvatar(@DecodeUser() user: UserWithoutPassword) {
    await this.mediaService.deleteAvatar(user.id);
    return { message: 'Avatar deleted' };
  }
}
