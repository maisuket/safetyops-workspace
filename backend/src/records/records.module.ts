import { Global, Module } from '@nestjs/common';
import { RecordsService } from './records.service';
import { RecordsController } from './records.controller';

@Global()
@Module({
  providers: [RecordsService],
  controllers: [RecordsController],
  exports: [RecordsService],
})
export class RecordsModule {}
