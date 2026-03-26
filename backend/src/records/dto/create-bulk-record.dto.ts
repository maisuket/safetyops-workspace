import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsArray,
  ArrayMinSize,
} from 'class-validator';

export enum RecordType {
  TRABALHO = 'trabalho',
  FOLGA = 'folga',
}

export class CreateBulkRecordDto {
  @ApiProperty({ enum: RecordType, description: 'Tipo de registo' })
  @IsEnum(RecordType)
  @IsNotEmpty()
  type: RecordType;

  @ApiProperty({
    example: '2026-03-23T00:00:00.000Z',
    description: 'Data da ocorrência',
  })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiPropertyOptional({
    example: 'Correção de vazamento de óleo - Energisa',
    description: 'Descrição da atividade',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: '01/03/2026',
    description: 'Data de referência',
  })
  @IsString()
  @IsOptional()
  refDate?: string;

  @ApiProperty({
    example: ['uuid-ivanildo', 'uuid-aluisio', 'uuid-jofre'],
    description: 'Lista de IDs dos Colaboradores',
  })
  @IsArray()
  @ArrayMinSize(1, {
    message: 'Pelo menos um colaborador deve ser selecionado',
  })
  @IsUUID('4', { each: true, message: 'Todos os IDs devem ser UUIDs válidos' })
  employeeIds: string[];

  @ApiPropertyOptional({ example: 'ITAM', description: 'Local do serviço' })
  @IsString()
  @IsOptional()
  local?: string;
}
