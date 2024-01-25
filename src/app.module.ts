import { Module } from '@nestjs/common';
import { DoggyModule } from './doggy/doggy.module';

@Module({
  imports: [DoggyModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
