import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Put,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { Document } from '@prisma/client';
import { UpdateDocumentDto } from './dto/update-document.dto';

@ApiTags('Documents')
@ApiBearerAuth()
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Arquivar um novo documento' })
  @ApiResponse({ status: 201, description: 'Documento arquivado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados de entrada inválidos.' })
  @ApiResponse({ status: 404, description: 'Colaborador não encontrado.' })
  async create(
    @Body() createDocumentDto: CreateDocumentDto,
  ): Promise<Document> {
    return this.documentsService.create(createDocumentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os documentos' })
  @ApiResponse({
    status: 200,
    description: 'Lista de documentos retornada com sucesso.',
  })
  async findAll(): Promise<Document[]> {
    return this.documentsService.findAll();
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar um documento existente' })
  @ApiParam({ name: 'id', description: 'UUID do documento a ser atualizado' })
  @ApiResponse({
    status: 200,
    description: 'Documento atualizado com sucesso.',
  })
  @ApiResponse({ status: 404, description: 'Documento não encontrado.' })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
  ): Promise<Document> {
    return this.documentsService.update(id, updateDocumentDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover um documento' })
  @ApiParam({ name: 'id', description: 'UUID do documento a ser removido' })
  @ApiResponse({ status: 200, description: 'Documento removido com sucesso.' })
  @ApiResponse({ status: 404, description: 'Documento não encontrado.' })
  async remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.documentsService.remove(id);
  }
}
