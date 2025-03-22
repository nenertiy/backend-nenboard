import { Controller, Get, Param, Res } from '@nestjs/common';
import { MediaService } from './media.service';
import { Response } from 'express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Media')
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @ApiOperation({ summary: 'Get media by key' })
  @Get(':key')
  async findOneByKey(@Param('key') key: string, @Res() res: Response) {
    const media = await this.mediaService.findOneByKey(key);
    res.setHeader('Content-Type', 'image/jpeg');
    media.pipe(res);
  }
}
