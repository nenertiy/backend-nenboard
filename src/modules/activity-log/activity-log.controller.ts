import { Controller, Get, Param } from '@nestjs/common';
import { ActivityLogService } from './activity-log.service';
import { ApiOperation } from '@nestjs/swagger';

@Controller('activity-log')
export class ActivityLogController {
  constructor(private readonly activityLogService: ActivityLogService) {}

  @ApiOperation({ summary: 'Get an activity log by id' })
  @Get(':id')
  findActivityLog(@Param('id') id: string) {
    return this.activityLogService.findActivityLog(id);
  }
}
