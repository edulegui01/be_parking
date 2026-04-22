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
}
