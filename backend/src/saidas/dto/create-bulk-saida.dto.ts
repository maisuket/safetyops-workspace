import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { CreateSaidaItemDto } from './create-saida-item.dto';

export class CreateBulkSaidaDto {
  @ApiProperty({
    type: [CreateSaidaItemDto],
    description:
      'Um item por colaborador/emissão — todos gravados com o mesmo batchId, pois saíram juntos no mesmo PDF/Excel gerado.',
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Pelo menos um registo deve ser enviado' })
  @ValidateNested({ each: true })
  @Type(() => CreateSaidaItemDto)
  items: CreateSaidaItemDto[];
}
