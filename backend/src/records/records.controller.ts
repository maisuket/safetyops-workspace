import {
  Controller,
  Post,
  Body,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Delete,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RecordsService } from './records.service';
import { CreateRecordDto } from './dto/create-record.dto';
import { CreateBulkRecordDto } from './dto/create-bulk-record.dto';
// import { FirebaseAuthGuard } from '../auth/firebase-auth.guard'; // A implementar

@ApiTags('Records')
@ApiBearerAuth()
// @UseGuards(FirebaseAuthGuard) -> Proteger as rotas utilizando o Firebase Auth JWT
@Controller('records')
export class RecordsController {
  constructor(private readonly recordsService: RecordsService) {}

  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Criar registro para múltiplos colaboradores simultaneamente',
  })
  @ApiResponse({ status: 201, description: 'Registros criados com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos fornecidos.' })
  async createBulk(@Body() createBulkRecordDto: CreateBulkRecordDto) {
    return this.recordsService.createBulk(createBulkRecordDto);
  }

  @Post()
  @ApiOperation({ summary: 'Criar um novo registo de folga/trabalho' })
  @ApiResponse({ status: 201, description: 'Registo criado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos fornecidos.' })
  async create(@Body() createRecordDto: CreateRecordDto) {
    return this.recordsService.create(createRecordDto);
  }

  @Get('employee/:employeeId')
  @ApiOperation({
    summary: 'Obter todo o histórico de um colaborador específico',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de registos do colaborador.',
  })
  async findByEmployee(
    @Param('employeeId', new ParseUUIDPipe({ version: '4' }))
    employeeId: string,
  ) {
    return this.recordsService.findByEmployee(employeeId);
  }

  @Get()
  @ApiOperation({ summary: 'Obter todos os registos' })
  @ApiResponse({ status: 200, description: 'Lista de registos.' })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.recordsService.findAll(page, limit);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir um registo permanentemente' })
  @ApiResponse({ status: 200, description: 'Registo removido com sucesso.' })
  async remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.recordsService.remove(id);
  }
}
