import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsUUID,
  IsArray,
  ArrayMinSize,
} from 'class-validator';

export class CreateBulkHoraExtraDto {
  @ApiProperty({
    example: '2026-08-25T00:00:00.000Z',
    description: 'Data do serviço (campo "DATA" do cabeçalho da folha)',
  })
  @IsDateString()
  @IsNotEmpty()
  dataServico: string;

  @ApiProperty({
    example: 'AMBAR ENERGIA - RORAIMA',
    description: 'Local do(s) serviço(s) realizado(s)',
  })
  @IsString()
  @IsNotEmpty()
  local: string;

  @ApiPropertyOptional({ example: 'Parametrização e testes em relé' })
  @IsString()
  @IsOptional()
  descricaoServico?: string;

  @ApiPropertyOptional({ example: 'Rua Exemplo, 123 - Boa Vista/RR' })
  @IsString()
  @IsOptional()
  enderecoServico?: string;

  @ApiPropertyOptional({ example: 'OS-4521' })
  @IsString()
  @IsOptional()
  numeroOS?: string;

  @ApiPropertyOptional({ example: 'Serviço realizado em regime de urgência' })
  @IsString()
  @IsOptional()
  observacao?: string;

  @ApiProperty({
    example: ['uuid-carlos', 'uuid-cesar'],
    description:
      'Colaboradores da folha, na ordem em que aparecem na tabela — todos gravados com o mesmo batchId, pois saíram juntos no mesmo PDF/Excel gerado.',
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Pelo menos um colaborador deve ser selecionado' })
  @IsUUID('4', { each: true, message: 'Todos os IDs devem ser UUIDs válidos' })
  employeeIds: string[];
}
