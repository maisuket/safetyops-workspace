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
import { HoraExtraService } from './hora-extra.service';
import { CreateBulkHoraExtraDto } from './dto/create-bulk-hora-extra.dto';
import { DeleteBulkHoraExtraDto } from './dto/delete-bulk-hora-extra.dto';

@ApiTags('HoraExtra')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('hora-extra')
export class HoraExtraController {
  constructor(private readonly horaExtraService: HoraExtraService) {}

  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Grava uma folha de Relação Hora Extra/Compensação (colaboradores emitidos juntos no mesmo PDF/Excel)',
  })
  @ApiResponse({ status: 201, description: 'Registos gravados com sucesso.' })
  async createBulk(@Body() dto: CreateBulkHoraExtraDto) {
    return this.horaExtraService.createBulk(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Rastreio de horas extras — busca por nome, local e/ou período',
  })
  async search(
    @Query('employeeId') employeeId?: string,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
  ) {
    // Teto de proteção: a UI nunca pede mais que algumas dezenas por página.
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    return this.horaExtraService.search(
      { employeeId, search, startDate, endDate },
      page,
      safeLimit,
    );
  }

  // Precisa vir ANTES de "@Delete(':id')" — senão o Nest tentaria casar
  // "bulk" como se fosse o valor do parâmetro :id.
  @Delete('bulk')
  @ApiOperation({
    summary: 'Remove vários registos de hora extra de uma vez (exclusão em lote)',
  })
  @ApiResponse({ status: 200, description: 'Registos removidos com sucesso.' })
  async removeBulk(@Body() dto: DeleteBulkHoraExtraDto) {
    return this.horaExtraService.removeBulk(dto.ids);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove um registo de hora extra (correção)' })
  async remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.horaExtraService.remove(id);
  }
}
