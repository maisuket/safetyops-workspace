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
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SaidasService } from './saidas.service';
import { CreateBulkSaidaDto } from './dto/create-bulk-saida.dto';
import { DeleteBulkSaidaDto } from './dto/delete-bulk-saida.dto';

@ApiTags('Saidas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('saidas')
export class SaidasController {
  constructor(private readonly saidasService: SaidasService) {}

  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Grava um lote de saídas/ubers emitidos juntos (mesmo PDF/Excel)',
  })
  @ApiResponse({ status: 201, description: 'Registos gravados com sucesso.' })
  async createBulk(@Body() dto: CreateBulkSaidaDto) {
    return this.saidasService.createBulk(dto);
  }

  @Get('employee/:employeeId')
  @ApiOperation({ summary: 'Histórico completo de saídas de um colaborador' })
  async findByEmployee(
    @Param('employeeId', new ParseUUIDPipe({ version: '4' }))
    employeeId: string,
  ) {
    return this.saidasService.findByEmployee(employeeId);
  }

  @Get()
  @ApiOperation({
    summary: 'Rastreio de saídas — busca por nome, tipo e/ou período',
  })
  async search(
    @Query('employeeId') employeeId?: string,
    @Query('tipo') tipo?: string,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
  ) {
    // Teto de proteção: a UI nunca pede mais que algumas dezenas por página.
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    return this.saidasService.search(
      { employeeId, tipo, search, startDate, endDate },
      page,
      safeLimit,
    );
  }

  // Precisa vir ANTES de "@Delete(':id')" — senão o Nest tentaria casar
  // "bulk" como se fosse o valor do parâmetro :id.
  @Delete('bulk')
  @ApiOperation({
    summary: 'Remove vários registos de saída de uma vez (exclusão em lote)',
  })
  @ApiResponse({ status: 200, description: 'Registos removidos com sucesso.' })
  async removeBulk(@Body() dto: DeleteBulkSaidaDto) {
    return this.saidasService.removeBulk(dto.ids);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove um registo de saída (correção)' })
  async remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.saidasService.remove(id);
  }
}
