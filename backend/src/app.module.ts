import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './database/prisma.module';
import { RecordsModule } from './records/records.module';
import { EmployeesModule } from './employees/employees.module';
import { DocumentsModule } from './documents/documents.module';

@Module({
  imports: [
    PrismaModule, // Como é Global, só precisa de ser importado aqui!
    RecordsModule,
    EmployeesModule,
    DocumentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
