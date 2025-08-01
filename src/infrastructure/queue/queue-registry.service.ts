import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bull';
import { ModuleRef } from '@nestjs/core';
import { Queue } from 'bull';
import { QueueService } from './queue.service';

@Injectable()
export class QueueRegistryService implements OnModuleInit {
  private readonly logger = new Logger(QueueRegistryService.name);

  private readonly knownQueueNames = ['analytics', 'notifications'];

  constructor(
    private readonly moduleRef: ModuleRef,
    private readonly queueService: QueueService,
  ) {}


  async onModuleInit() {
    try {
      const queueNames = this.getRegisteredQueueNames();
      
      this.logger.log(`Discovered ${queueNames.length} queue(s) to register`);
      
      for (const queueName of queueNames) {
        try {
          const queue = this.moduleRef.get<Queue>(getQueueToken(queueName), { strict: false });
          if (queue) {
            this.queueService.registerQueue(queueName, queue);
            this.logger.log(`Registered queue: ${queueName}`);
          }
        } catch (err) {
          this.logger.error(`Error registering queue ${queueName}:`, err instanceof Error ? err.stack : String(err));
        }
      }
    } catch (err) {
      this.logger.error('Error initializing queue registry:', err instanceof Error ? err.stack : String(err));
    }
  }


  private getRegisteredQueueNames(): string[] {
    return this.knownQueueNames;
  }
}
