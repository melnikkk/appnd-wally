import { Injectable, Logger } from '@nestjs/common';
import { Queue, Job, JobStatus, JobStatusClean } from 'bull';
import {
  QueueNotFoundException,
  JobAddException,
  QueueOperationException,
} from './exceptions/queue.exceptions';

export interface QueueJobOptions {
  name: string;
  queueName: string;
  data: any;
  delay?: number;
  removeOnComplete?: boolean | number;
  removeOnFail?: boolean | number;
  attempts?: number;
  backoff?: number | { type: string; delay: number };
  lifo?: boolean;
  timeout?: number;
  priority?: number;
  jobId?: string;
}

export interface JobStatusInfo {
  exists: boolean;
  id?: string;
  state?: string;
  progress?: number;
  data?: any;
  returnvalue?: any;
  failedReason?: string;
  stacktrace?: string[];
  timestamp?: number;
}

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);
  private queues: Map<string, Queue> = new Map();

  constructor() {}

  registerQueue(queueName: string, queue: Queue): void {
    this.queues.set(queueName, queue);
  }

  getQueue(queueName: string): Queue | undefined {
    return this.queues.get(queueName);
  }

  async addJob(options: QueueJobOptions): Promise<Job> {
    const { queueName, name, data, ...jobOptions } = options;
    const queue = this.queues.get(queueName);

    if (!queue) {
      throw new QueueNotFoundException(queueName);
    }

    try {
      return await queue.add(name, data, jobOptions);
    } catch (error) {
      throw new JobAddException(queueName, name, {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async getJobStatus(queueName: string, jobId: string): Promise<JobStatusInfo> {
    const queue = this.queues.get(queueName);

    if (!queue) {
      throw new QueueNotFoundException(queueName);
    }

    const job = await queue.getJob(jobId);

    if (!job) {
      return { exists: false };
    }

    const state = await job.getState();
    const progress = await job.progress();

    return {
      exists: true,
      id: String(job.id),
      state,
      progress,
      data: job.data,
      returnvalue: job.returnvalue,
      failedReason: job.failedReason,
      stacktrace: job.stacktrace,
      timestamp: job.timestamp,
    };
  }

  async getJobs(
    queueName: string,
    status?: JobStatus,
    start: number = 0,
    end: number = 20,
  ): Promise<Job[]> {
    const queue = this.queues.get(queueName);

    if (!queue) {
      throw new QueueNotFoundException(queueName);
    }

    if (status) {
      return queue.getJobs([status], start, end);
    }

    const statusTypes: JobStatus[] = [
      'waiting',
      'active',
      'completed',
      'failed',
      'delayed',
      'paused',
    ];
    const jobPromises = statusTypes.map((type) => queue.getJobs([type], start, end));
    const jobArrays = await Promise.all(jobPromises);

    return jobArrays.flat();
  }

  async pauseQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);

    if (!queue) {
      throw new QueueNotFoundException(queueName);
    }

    try {
      await queue.pause();

      this.logger.log(`Queue ${queueName} paused`);
    } catch (error) {
      throw new QueueOperationException('pause', queueName, {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async resumeQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);

    if (!queue) {
      throw new QueueNotFoundException(queueName);
    }

    try {
      await queue.resume();
      this.logger.log(`Queue ${queueName} resumed`);
    } catch (error) {
      throw new QueueOperationException('resume', queueName, {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async cleanQueue(
    queueName: string,
    grace: number = 24 * 60 * 60 * 1000,
    status?: JobStatusClean,
    limit?: number,
  ): Promise<void> {
    const queue = this.queues.get(queueName);

    if (!queue) {
      throw new QueueNotFoundException(queueName);
    }

    try {
      const count = await queue.clean(grace, status, limit);
      this.logger.log(`Cleaned ${count} jobs from queue ${queueName}`);
    } catch (error) {
      throw new QueueOperationException('clean', queueName, {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
