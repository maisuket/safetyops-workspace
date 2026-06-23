import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsUUID,
  IsEnum,
} from 'class-validator';

export enum RecordType {
  TRABALHO = 'trabalho',
  FOLGA = 'folga',
  FALTA = 'falta',
  SERVICO_EXTERNO = 'servico_externo',
  AJUSTE_HORARIO = 'ajuste_horario',
}

export class CreateRecordDto {
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
    example: 'Serviço Energisa',
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

  @ApiPropertyOptional({
    example: 'Saiu pela parte da tarde, compensação o restante do dia',
    description: 'Justificativa para folga/falta (ex: saída antecipada, serviço externo)',
  })
  @IsString()
  @IsOptional()
  justification?: string;

  @ApiProperty({
    example: 'uuid-do-colaborador',
    description: 'ID do Colaborador',
  })
  @IsUUID()
  @IsNotEmpty()
  employeeId: string;
}
