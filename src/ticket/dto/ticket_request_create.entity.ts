import { IsNotEmpty, IsString } from 'class-validator';

export class TicketRequestCreate {
  @IsNotEmpty({ message: 'El campo ticket es requerido' })
  @IsString({ message: 'El campo ticket debe ser una cadena de texto' })
  ticket_code: string;
}
