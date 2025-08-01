import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Processor('analytics')
export class AnalyticsProcessor {
  private readonly logger = new Logger(AnalyticsProcessor.name);

  constructor(private readonly prismaService: PrismaService) {}

  @Process('process-logs')
  async processLogs(job: Job<{ userId: string; timeframe: string }>) {
    this.logger.debug(`Processing analytics for user ${job.data.userId}`);
    
    try {
      const { userId, timeframe } = job.data;
      
      let startDate: Date;
      const now = new Date();
      
      switch (timeframe) {
        case 'day':
          startDate = new Date(now.setDate(now.getDate() - 1));
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        default:
          startDate = new Date(now.setDate(now.getDate() - 30));
      }
      
      const logsCount = await this.prismaService.requestLog.count({
        where: {
          userId,
          createdAt: {
            gte: startDate,
          },
        },
      });
      
      this.logger.debug(`Found ${logsCount} logs for user ${userId} in the last ${timeframe}`);
      
      return { 
        userId, 
        timeframe, 
        logsCount,
        processedAt: new Date() 
      };
    } catch (error) {
      this.logger.error(`Failed to process logs: ${error.message}`, error.stack);
      throw error;
    }
  }
}
