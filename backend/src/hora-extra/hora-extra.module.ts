import { Module } from '@nestjs/common';
import { HoraExtraService } from './hora-extra.service';
import { HoraExtraController } from './hora-extra.controller';

@Module({
  providers: [HoraExtraService],
  controllers: [HoraExtraController],
  exports: [HoraExtraService],
})
export class HoraExtraModule {}
