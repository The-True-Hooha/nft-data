import { Module } from '@nestjs/common';
import { DoggyController } from './controller/doggy.controller';
import { DoggyService } from './service/doggy.service';
import { QueueService } from './service/queue.service';

@Module({
  controllers: [DoggyController],
  providers: [QueueService, DoggyService],
  exports: [QueueService, DoggyService],
})
export class DoggyModule {}
