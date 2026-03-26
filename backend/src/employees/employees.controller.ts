import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeStatusDto } from './dto/update-employee-status.dto';
import { Employee } from '@prisma/client';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@ApiTags('Employees')
@ApiBearerAuth() // Necessário para indicar ao Swagger que exige Token JWT
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos os colaboradores' })
  @ApiResponse({
    status: 200,
    description: 'Lista de colaboradores retornada com sucesso.',
  })
  async findAll(): Promise<Employee[]> {
    return this.employeesService.findAll();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cadastrar um novo colaborador' })
  @ApiResponse({ status: 201, description: 'Colaborador criado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados de entrada inválidos.' })
  async create(
    @Body() createEmployeeDto: CreateEmployeeDto,
  ): Promise<Employee> {
    return this.employeesService.create(createEmployeeDto);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Ativar ou inativar um colaborador' })
  @ApiParam({ name: 'id', description: 'UUID do colaborador' })
  @ApiResponse({ status: 200, description: 'Status atualizado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Colaborador não encontrado.' })
  async toggleStatus(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string, // Validação extra de UUID
    @Body() updateStatusDto: UpdateEmployeeStatusDto,
  ): Promise<Employee> {
    return this.employeesService.toggleStatus(id, updateStatusDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar dados de um colaborador' })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
  ) {
    return this.employeesService.update(id, updateEmployeeDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir um colaborador permanentemente' })
  async remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.employeesService.remove(id);
  }
}
