import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { 
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiProperty,
  ApiPropertyOptional
} from '@nestjs/swagger';

class ProcessLogsDto {
  @ApiProperty({ description: 'User ID to process logs for', example: 'user_123456789' })
  userId: string;

  @ApiPropertyOptional({ 
    description: 'Timeframe for log processing',
    enum: ['day', 'week', 'month'],
    default: 'day',
    example: 'day'
  })
  timeframe?: 'day' | 'week' | 'month';
}

@ApiTags('analytics')
@ApiBearerAuth()
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('process-logs')
  @ApiOperation({ summary: 'Process user logs', description: 'Schedules processing of user logs for analytics' })
  @ApiResponse({ status: 200, description: 'Log processing scheduled' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiBody({ type: ProcessLogsDto })
  async processLogs(
    @Body() data: { userId: string; timeframe?: 'day' | 'week' | 'month' },
  ) {
    return this.analyticsService.scheduleLogsProcessing(
      data.userId,
      data.timeframe || 'day',
    );
  }

  @Get('job/:id')
  @ApiOperation({ summary: 'Get job status', description: 'Gets the status of a scheduled job' })
  @ApiResponse({ status: 200, description: 'Job status' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  @ApiParam({ name: 'id', description: 'Job ID' })
  async getJobStatus(@Param('id') id: string) {
    return this.analyticsService.getJobStatus(id);
  }
}
