import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class PagoRequestDto {
  @IsString()
  @IsNotEmpty()
  ticket_code: string;

  @IsNumber()
  @IsNotEmpty()
  monto: number;

  @IsNumber()
  @IsOptional()
  id_expediente?: number | null;

  @IsString()
  @IsOptional()
  ruc?: string;

  @IsString()
  @IsOptional()
  a_nombre_de?: string;

  @IsString()
  @IsOptional()
  correo_electronico?: string;

  @IsString()
  @IsOptional()
  ip_address?: string;

  @IsString()
  @IsOptional()
  hostname?: string;
}
