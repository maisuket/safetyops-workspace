import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsBoolean,
} from 'class-validator';

export class CreateEmployeeDto {
  @ApiProperty({
    example: 'ALUISIO MACIEL SOARES',
    description: 'Nome completo do colaborador',
  })
  @IsString({ message: 'O nome deve ser uma string válida.' })
  @IsNotEmpty({ message: 'O nome não pode estar vazio.' })
  @MinLength(3, { message: 'O nome deve ter pelo menos 3 caracteres.' })
  @MaxLength(100, { message: 'O nome não pode exceder 100 caracteres.' })
  name: string;

  @IsString({ message: 'A matrícula deve ser um texto válido.' })
  @IsNotEmpty({ message: 'O campo matrícula não pode estar vazio.' })
  @MinLength(1, { message: 'O campo matrícula não pode estar vazio.' })
  @MaxLength(100, { message: 'A matrícula não pode exceder 100 caracteres.' })
  enrollment: string;
}
