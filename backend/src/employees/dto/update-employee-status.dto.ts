import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateEmployeeStatusDto {
  @ApiProperty({
    example: true,
    description: 'Define se o colaborador está ativo (true) ou inativo (false)',
  })
  @IsBoolean({ message: 'O status deve ser um valor booleano (true/false).' })
  @IsNotEmpty({ message: 'O status não pode estar vazio.' })
  active: boolean;
}
