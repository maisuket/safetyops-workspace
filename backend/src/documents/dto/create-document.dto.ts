import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class CreateDocumentDto {
  @ApiProperty({
    example: 'NR 35 - Trabalho em Altura',
    description: 'Tipo ou norma do documento',
  })
  @IsString({ message: 'O tipo de documento deve ser uma string válida.' })
  @IsNotEmpty({ message: 'O tipo de documento não pode estar vazio.' })
  docType: string;

  @ApiPropertyOptional({
    example: '2025-10-15',
    description: 'Data de emissão do documento',
  })
  @IsDateString(
    {},
    {
      message:
        'A data de emissão deve estar num formato ISO válido (YYYY-MM-DD).',
    },
  )
  @IsOptional()
  issueDate?: string;

  @ApiProperty({
    example: '2026-10-15',
    description: 'Data de vencimento/validade do documento',
  })
  @IsDateString(
    {},
    {
      message:
        'A data de vencimento deve estar num formato ISO válido (YYYY-MM-DD).',
    },
  )
  @IsNotEmpty({ message: 'A data de vencimento é obrigatória.' })
  expiryDate: string;

  @ApiProperty({
    example: 'uuid-do-colaborador',
    description: 'ID do Colaborador vinculado a este documento',
  })
  @IsUUID('4', { message: 'O ID do colaborador deve ser um UUID válido.' })
  @IsNotEmpty({ message: 'O ID do colaborador é obrigatório.' })
  employeeId: string;
}
