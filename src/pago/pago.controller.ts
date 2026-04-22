import { Body, Controller, Post } from '@nestjs/common';
import { PagoService } from './pago.service';
import { PagoRequestDto } from './dto/pago-request.dto';
import { ApiResponse } from 'src/common/api-response.type';
import { TicketResponseGenerateInvoice } from 'src/ticket/dto/ticket_response_generate_invoice';

@Controller('pago')
export class PagoController {
  constructor(private readonly pagoService: PagoService) {}

  @Post('tarjeta')
  async pagarTarjeta(
    @Body() data: PagoRequestDto,
  ): Promise<ApiResponse<TicketResponseGenerateInvoice>> {
    return this.pagoService.pagarTarjeta(data);
  }

  @Post('qr')
  async pagarQr(
    @Body() data: PagoRequestDto,
  ): Promise<ApiResponse<TicketResponseGenerateInvoice>> {
    return this.pagoService.pagarQr(data);
  }
}
