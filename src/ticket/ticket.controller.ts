import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { TicketRequestCreate } from './dto/ticket_request_create.entity';
import { TicketResponseCreate } from './dto/ticket_response_create.entity';
import { TicketResponseConsultaMonto } from './dto/ticket_response_consulta_monto.entity';
import { TicketResponseConsultarContribuyente } from './dto/ticket_response_consultar_contribuyente.entity';
import { ApiResponse } from 'src/common/api-response.type';
import { TicketResponseGenerateInvoice } from './dto/ticket_response_generate_invoice';
import { TicketRequestGenerateInvoice } from './dto/ticket_request_generate_invoice';
import { TicketResponseExit } from './dto/ticket_response_exit';
import { TicketRequestExit } from './dto/ticket_request_exit.entity';

@Controller('ticket')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Post()
  async create(
    @Body() data: TicketRequestCreate,
  ): Promise<ApiResponse<TicketResponseCreate>> {
    return this.ticketService.create(data);
  }

  @Get('consultar-contribuyente')
  async consultarContribuyente(
    @Query('documento') documento: string,
  ): Promise<ApiResponse<TicketResponseConsultarContribuyente>> {
    return this.ticketService.consultarContribuyente(documento);
  }

  @Get('consulta-monto')
  async consultaMonto(
    @Query('ticket_code') ticket_code: string,
    @Query('documento') documento: string,
  ): Promise<ApiResponse<TicketResponseConsultaMonto>> {
    return this.ticketService.consultaMonto(ticket_code, documento);
  }

  @Post('generate-invoice')
  async generateInvoice(
    @Body() data: TicketRequestGenerateInvoice,
  ): Promise<ApiResponse<TicketResponseGenerateInvoice>> {
    return this.ticketService.generateInvoice(data);
  }

  @Post('exit')
  async exit(
    @Body() data: TicketRequestExit,
  ): Promise<ApiResponse<TicketResponseExit>> {
    return this.ticketService.exit(data.ticket_code, data.nfc);
  }
}
