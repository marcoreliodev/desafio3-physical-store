import { Transform } from 'class-transformer';
import { IsString, Matches } from 'class-validator';

export class CepValidationDto {
  @Transform(({ value }) => String(value))
  @IsString()
  @Matches(/^\d{5}-?\d{3}$/, { message: 'Formato de CEP inválido.' })
  cep: string;
}
