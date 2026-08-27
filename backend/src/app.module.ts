import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './database/prisma.module';
import { RecordsModule } from './records/records.module';
import { EmployeesModule } from './employees/employees.module';
import { DocumentsModule } from './documents/documents.module';
import { AuthModule } from './auth/auth.module';
import { SaidasModule } from './saidas/saidas.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    RecordsModule,
    EmployeesModule,
    DocumentsModule,
    SaidasModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
