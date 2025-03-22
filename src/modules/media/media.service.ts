import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { MediaRepository } from './media.repository';
import { InjectS3, S3 } from 'nestjs-s3';
import { ConfigService } from '@nestjs/config';
import { MediaType } from '@prisma/client';
import { Readable } from 'stream';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MediaService implements OnModuleInit {
  private bucketName: string;
  constructor(
    @InjectS3() private readonly s3: S3,
    private readonly mediaRepository: MediaRepository,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    this.bucketName = this.configService.get('S3_BUCKET_NAME');
  }

  async uploadFile(file: Express.Multer.File, type: MediaType) {
    const key = `${type}-${uuidv4()}-${file.originalname}`;
    try {
      const upload = await this.s3.putObject({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
      });

      const media = await this.mediaRepository.create({
        url: key,
        type,
        filename: file.originalname,
      });

      return media;
    } catch (error) {
      throw new InternalServerErrorException('Failed to upload file to S3');
    }
  }

  async findOneByKey(key: string): Promise<Readable> {
    try {
      const media = await this.s3.getObject({
        Bucket: this.bucketName,
        Key: key,
      });
      return media.Body as Readable;
    } catch (error) {
      throw new NotFoundException();
    }
  }

  async deleteObject(key: string) {
    try {
      await this.s3.deleteObject({
        Bucket: this.bucketName,
        Key: key,
      });
    } catch (error) {
      throw new NotFoundException();
    }
  }

  async delete(id: string) {
    await this.mediaRepository.delete(id);
  }

  async findOneById(id: string) {
    const media = await this.mediaRepository.findOne(id);
    if (!media) {
      throw new NotFoundException();
    }
    return media;
  }

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    const user = await this.mediaRepository.findUserAvatar(userId);
    if (user.avatar) {
      await this.delete(user.avatar.id);
      await this.deleteObject(user.avatar.url);
    }
    const upload = await this.uploadFile(file, MediaType.AVATAR);
    await this.mediaRepository.uploadUserAvatar(userId, upload.id);
    return upload;
  }

  async deleteAvatar(userId: string) {
    const user = await this.mediaRepository.findUserAvatar(userId);
    if (!user.avatar) {
      throw new NotFoundException('User does not have an avatar');
    }
    await this.delete(user.avatar.id);
    await this.deleteObject(user.avatar.url);
  }
}
