import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class TicketRequestGenerateInvoice {
  @IsString()
  @IsNotEmpty()
  ticket_code: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsNumber()
  @IsOptional()
  id_expediente: number | null;

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

  @IsString()
  @IsOptional()
  nro_boleta?: string;

  @IsString()
  @IsOptional()
  issuer_id?: string;
}
