import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsUUID,
  IsEnum,
} from 'class-validator';

export enum SaidaTipo {
  SAIDA = 'saida',
  UBER = 'uber',
}

export enum SaidaTipoData {
  SAIDA = 'saida',
  ENTRADA = 'entrada',
}

export class CreateSaidaItemDto {
  @ApiProperty({ example: 'uuid-do-colaborador' })
  @IsUUID()
  @IsNotEmpty()
  employeeId: string;

  @ApiProperty({ enum: SaidaTipo })
  @IsEnum(SaidaTipo)
  @IsNotEmpty()
  tipo: SaidaTipo;

  @ApiPropertyOptional({
    enum: SaidaTipoData,
    description: 'Só se aplica quando tipo = "saida"',
  })
  @IsEnum(SaidaTipoData)
  @IsOptional()
  tipoData?: SaidaTipoData;

  @ApiPropertyOptional({
    example: 'ITAM X CASA',
    description: 'Só se aplica quando tipo = "uber"',
  })
  @IsString()
  @IsOptional()
  destino?: string;

  @ApiProperty({ example: 'ATENDIMENTO TÉCNICO EXTERNO' })
  @IsString()
  @IsNotEmpty()
  motivo: string;

  @ApiPropertyOptional({
    example: '2026-08-27T00:00:00.000Z',
    description: 'Ausente quando o formulário é emitido com "data em branco"',
  })
  @IsDateString()
  @IsOptional()
  dataOcorrencia?: string;
}
