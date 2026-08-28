import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';

export class DeleteBulkHoraExtraDto {
  @ApiProperty({
    example: ['uuid-1', 'uuid-2'],
    description: 'IDs dos registos de hora extra a excluir de uma vez',
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Pelo menos um registo deve ser selecionado' })
  @IsUUID('4', { each: true, message: 'Todos os IDs devem ser UUIDs válidos' })
  ids: string[];
}
