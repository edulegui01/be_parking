import { IsDate, IsNotEmpty, IsString } from 'class-validator';

export class TicketRequestUpdate {
  @IsNotEmpty({ message: 'El codigo del ticket es requerido' })
  @IsString({ message: 'El codigo del ticket debe ser una cadena de texto' })
  ticket_code: string;

  @IsNotEmpty({ message: 'La fecha de salida es requerida' })
  @IsDate({ message: 'La fecha de salida debe ser una fecha válida' })
  exit_date: Date;
}
