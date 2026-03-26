import { Module } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { EmployeesController } from './employees.controller';

@Module({
  controllers: [EmployeesController],
  providers: [EmployeesService],
  exports: [EmployeesService], // Exportamos caso o RecordsModule precise validar colaboradores no futuro
})
export class EmployeesModule {}
