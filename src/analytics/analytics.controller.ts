import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('process-logs')
  async processLogs(
    @Body() data: { userId: string; timeframe?: 'day' | 'week' | 'month' },
  ) {
    return this.analyticsService.scheduleLogsProcessing(
      data.userId,
      data.timeframe || 'day',
    );
  }

  @Get('job/:id')
  async getJobStatus(@Param('id') id: string) {
    return this.analyticsService.getJobStatus(id);
  }
}
