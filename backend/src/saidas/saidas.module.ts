import { Module } from '@nestjs/common';
import { SaidasService } from './saidas.service';
import { SaidasController } from './saidas.controller';

@Module({
  providers: [SaidasService],
  controllers: [SaidasController],
  exports: [SaidasService],
})
export class SaidasModule {}
