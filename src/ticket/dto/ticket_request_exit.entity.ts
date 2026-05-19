import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class TicketRequestExit {
  @IsNotEmpty({ message: 'El campo ticket es requerido' })
  @IsString({ message: 'El campo ticket debe ser una cadena de texto' })
  ticket_code: string;

  @IsNotEmpty({ message: 'El campo nfc es requerido' })
  @IsBoolean({ message: 'El campo nfc debe ser un booleano' })
  nfc: boolean;
}
