import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { CreateDocumentDto } from './create-document.dto';

export class CreateBulkDocumentDto {
  @ApiProperty({
    type: [CreateDocumentDto],
    description:
      'Lista de documentos a arquivar de uma vez (ex: importação de planilha de SST).',
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Pelo menos um documento deve ser enviado' })
  @ValidateNested({ each: true })
  @Type(() => CreateDocumentDto)
  items: CreateDocumentDto[];
}
