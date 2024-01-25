import { Injectable, Logger } from '@nestjs/common';
// import * as path from 'path';

@Injectable()
export class QueueService {
  private queue: string[] = [];

  private readonly logger = new Logger(QueueService.name);
  constructor() {}

  enqueue(id: string): void {
    this.queue.push(id);
    this.logger.log(`adding new id to the queue: ${id}`);
  }

  dequeue(): string | undefined {
    if (this.isEmpty()) {
      this.logger.log(
        `oops, the queue is empty cannot perform dequeue operation`,
      );
      return undefined;
    }

    const id = this.queue.shift();
    this.logger.log(`removing id from the queue: ${id}`);
    return id;
  }

  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  getSize(): number {
    this.logger.log(`fetching the total size of the queue`);
    return this.queue.length;
  }
}
