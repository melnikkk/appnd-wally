import { Injectable } from '@nestjs/common';
import { QueueService } from '../infrastructure/queue/queue.service';

@Injectable()
export class AnalyticsService {
  private readonly QUEUE_NAME = 'analytics';
  
  constructor(private readonly queueService: QueueService) {}

  /**
   * Schedule a background job to process logs for a user
   */
  async scheduleLogsProcessing(userId: string, timeframe: 'day' | 'week' | 'month' = 'day') {
    const job = await this.queueService.addJob({
      queueName: this.QUEUE_NAME,
      name: 'process-logs',
      data: { userId, timeframe },
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: true,
    });
    
    return {
      jobId: job.id,
      status: 'scheduled'
    };
  }
  
  /**
   * Get the status of an analytics job
   */
  async getJobStatus(jobId: string) {
    return this.queueService.getJobStatus(this.QUEUE_NAME, jobId);
  }
}
